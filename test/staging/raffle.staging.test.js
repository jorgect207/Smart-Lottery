const { assert, expect } = require("chai")
const { randomBytes } = require("ethers/lib/utils")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentNetwork, networkConfig } = require("../../helper-hardhat-config")

developmentNetwork.includes(network.name)
    ? describe.skip
    : describe("all project", async function () {
          let RaffleContract, deployer
          const chainId = network.config.chainId
          function getRandomArbitrary(min, max) {
              return Math.random() * (max - min) + min
          }

          beforeEach("deployments", async function () {
              deployer = (await getNamedAccounts()).deployer
              const { deploy, log } = deployments

              RaffleContract = await ethers.getContract("Raffle")
              ethersMoney = ethers.utils.parseEther("0.01")
              interval = await RaffleContract.get_interval()
          })

          describe("send money", async function () {
              it("send money just in case", async function () {
                  const accounts = await ethers.getSigners()

                  await new Promise(async (resolve, reject) => {
                      RaffleContract.once("new_winner", async () => {
                          try {
                              console.log("winner picked")
                              const winner = await RaffleContract.get_address_winner()
                              const Number_winner = await RaffleContract.get_last_number_winner()

                              console.log(
                                  `the address winner is: ${winner} and the number was: ${Number_winner}`
                              )
                              const state = await RaffleContract.get_state()
                              assert.equal(state.toString(), "0")
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      console.log("let")

                      for (let i = 2; i < 6; i++) {
                          const newplayers = await RaffleContract.connect(accounts[i])
                          await newplayers.Buy_lottery("23", {
                              value: ethersMoney,
                          })
                      }
                      console.log("let")
                  })
              })
          })
      })
