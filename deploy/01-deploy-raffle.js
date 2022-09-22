const { network, ethers } = require("hardhat")

const { developmentNetwork, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

/* uint32 num_winners,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _s_subscriptionId,
        uint256 _interval
*/

module.exports = async function ({ getNamedAccounts, deployments }) {
    const chainId = network.config.chainId
    let vrfCoordinatorAddress, subscriptionId, vrfCoordinatorV2Mock, vrfCoordinatorV2Address
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentNetwork.includes(network.name)) {
        const vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock")

        vrfCoordinatorAddress = vrfCoordinator.address

        const transaction = await vrfCoordinator.createSubscription()
        const transaction_receipt = await transaction.wait(1)

        subscriptionId = transaction_receipt.events[0].args.subId

        await vrfCoordinator.fundSubscription(subscriptionId, "1000000000000000000000")
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorAddress"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const args = [
        "1",
        vrfCoordinatorAddress,
        networkConfig[chainId]["keyhash"],
        subscriptionId,
        networkConfig[chainId]["interval"],
    ]
    const deploy_raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmation || 1,
    })

    log("contract deployed!!")

    if (!developmentNetwork.includes(network.name) && process.env.ETHERSCAN_VERICATION) {
        log("verifying.....")
        await verify(deploy_raffle.address, args)
        log("contract verify")
    }
}

module.exports.tags = ["all", "raffle"]
