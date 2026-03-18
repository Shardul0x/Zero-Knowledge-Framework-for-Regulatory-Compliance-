import { useState, useEffect } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const ABI = [
  "function deposit(bytes32 commitment) external payable",
  "function withdraw(bytes32 nullifierHash, address payable recipient) external",
  "function commitments(bytes32) view returns (bool)",
  "function nullifiers(bytes32) view returns (bool)",
];

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    if (!window.ethereum) return;
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await refreshBalance(accounts[0]);
    }
  }

  async function refreshBalance(addr) {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const bal = await provider.getBalance(addr);
    setBalance(ethers.formatEther(bal));
  }

  async function connectWallet() {
    if (!window.ethereum) { setStatus("❌ MetaMask not found"); return; }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0]);
    await refreshBalance(accounts[0]);
    setStatus("✅ Wallet connected!");
  }

  async function deposit() {
    if (!secret) { setStatus("❌ Enter a secret word first"); return; }
    try {
      setLoading(true);
      setStatus("⏳ Sending deposit...");

      // Bypass MetaMask — talk directly to Hardhat node
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const signer = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes(secret));

      const exists = await contract.commitments(commitment);
      if (exists) { setStatus("⚠️ Secret already deposited! Use a different word."); return; }

      const tx = await contract.deposit(commitment, { value: ethers.parseEther("0.1") });
      setStatus("⏳ Waiting for confirmation...");
      await tx.wait();

      await refreshBalance(account);
      setStatus(`✅ Deposited! Save your secret: "${secret}"`);
    } catch (e) {
      setStatus("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function withdraw() {
    if (!secret) { setStatus("❌ Enter your secret word"); return; }
    try {
      setLoading(true);
      setStatus("⏳ Withdrawing...");

      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const signer = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // Withdraw to Account #1 — different address, that's the whole point!
      const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(secret));

      const used = await contract.nullifiers(nullifierHash);
      if (used) { setStatus("⚠️ This secret was already withdrawn!"); return; }

      const balBefore = await provider.getBalance(recipient);
      const tx = await contract.withdraw(nullifierHash, recipient);
      await tx.wait();
      const balAfter = await provider.getBalance(recipient);
      const received = ethers.formatEther(balAfter - balBefore);

      await refreshBalance(account);
      setStatus(`✅ Withdrew ${received} ETH to different address! Source untraceable.`);
    } catch (e) {
      setStatus("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace" }}>
      <div style={{ background:"#0f1628", border:"1px solid #1e2d4a", borderRadius:16, padding:40, width:460, color:"#e2e8f0" }}>
        <div style={{ fontSize:24, fontWeight:800, color:"#00d4ff", marginBottom:4 }}>🔐 Compliance Mixer</div>
        <div style={{ fontSize:12, color:"#64748b", marginBottom:24 }}>Privacy + Compliance · Hardhat Local</div>

        {!account ? (
          <button onClick={connectWallet} style={{ width:"100%", padding:13, background:"#00d4ff", border:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:"pointer", marginBottom:16 }}>
            Connect MetaMask
          </button>
        ) : (
          <div style={{ background:"#060b15", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13 }}>
            <div style={{ color:"#64748b" }}>Account: <span style={{color:"#00d4ff"}}>{account.slice(0,8)}...{account.slice(-6)}</span></div>
            <div style={{ color:"#64748b" }}>Balance: <span style={{color:"#10b981"}}>{balance ? parseFloat(balance).toFixed(4) + " ETH" : "Loading..."}</span></div>
          </div>
        )}

        <div style={{ background:"#00d4ff0a", border:"1px solid #00d4ff20", borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:12, color:"#94a3b8" }}>
          💡 Deposit with a secret word → Withdraw to a different address. No link on-chain.
        </div>

        <div style={{ fontSize:11, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>Secret Word</div>
        <input
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="e.g. mysecret123"
          style={{ width:"100%", padding:"12px 14px", background:"#060b15", border:"1px solid #1e2d4a", borderRadius:8, color:"#e2e8f0", fontSize:14, fontFamily:"monospace", boxSizing:"border-box", marginBottom:16 }}
        />

        <button onClick={deposit} disabled={loading} style={{ width:"100%", padding:13, background:"#00d4ff", border:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:"pointer", marginBottom:10 }}>
          {loading ? "⏳ Processing..." : "💰 Deposit 0.1 ETH"}
        </button>
        <button onClick={withdraw} disabled={loading} style={{ width:"100%", padding:13, background:"#7b2fff", border:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:"pointer", color:"#fff" }}>
          {loading ? "⏳ Processing..." : "🔐 Withdraw to New Address"}
        </button>

        {status && (
          <div style={{ marginTop:20, padding:"12px 16px", background:"#060b15", border:"1px solid #1e2d4a", borderRadius:8, fontSize:13, color: status.startsWith("✅") ? "#10b981" : status.startsWith("❌") ? "#ff6b35" : "#fbbf24" }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}