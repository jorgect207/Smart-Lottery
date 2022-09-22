const { networkConfig, developmentNetwork } = require("../helper-hardhat-config")
const { network, ethers, deployments, getNamedAccounts } = require("hardhat")

/*Constructor(uint96 _baseFee, uint96 _gasPriceLink) {
    BASE_FEE = _baseFee;
    GAS_PRICE_LINK = _gasPriceLink;
  }*/
BASE_FEE = "250000000000000000"
GAS_PRICE_LINK = 1e9

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    if (developmentNetwork.includes(network.name)) {
        log("deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: [BASE_FEE, GAS_PRICE_LINK],
            log: true,
        })
    }

    log("mocks deployed!!!!")
}

module.exports.tags = ["all", "mocks"]
