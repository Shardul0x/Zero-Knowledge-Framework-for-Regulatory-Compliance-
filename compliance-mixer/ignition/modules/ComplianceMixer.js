const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ComplianceMixerModule", (m) => {
  const mixer = m.contract("ComplianceMixer");
  return { mixer };
});