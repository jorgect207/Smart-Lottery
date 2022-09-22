const networkConfig = {
    5: {
        name: "goerly",
        vrfCoordinatorAddress: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        keyhash: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "0",
        interval: "30",
    },
    31337: {
        name: "hardhat",
        keyhash: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        interval: "30",
    },
}

const developmentNetwork = ["hardhat", "localhost"]

module.exports = { networkConfig, developmentNetwork }
