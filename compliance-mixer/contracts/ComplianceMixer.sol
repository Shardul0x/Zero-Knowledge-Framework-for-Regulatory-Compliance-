// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ComplianceMixer {
    uint256 public denomination = 0.1 ether;
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifiers;

    event Deposit(bytes32 indexed commitment);
    event Withdrawal(address indexed recipient, bytes32 nullifierHash);

    function deposit(bytes32 commitment) external payable {
        require(msg.value == denomination, "Wrong amount");
        require(!commitments[commitment], "Already deposited");
        commitments[commitment] = true;
        emit Deposit(commitment);
    }

    function withdraw(bytes32 nullifierHash, address payable recipient) external {
        require(!nullifiers[nullifierHash], "Already withdrawn");
        nullifiers[nullifierHash] = true;
        recipient.transfer(denomination);
        emit Withdrawal(recipient, nullifierHash);
    }
}