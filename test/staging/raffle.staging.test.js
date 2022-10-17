const { assert, expect } = require("chai")
const { randomBytes } = require("ethers/lib/utils")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentNetwork, networkConfig } = require("../../helper-hardhat-config")

developmentNetwork.includes(network.name)
    ? describe.skip
    : describe("all project", async function () {
          let RaffleContract, deployer
          const chainId = network.config.chainId

          beforeEach("deployments", async function () {
              deployer = (await getNamedAccounts()).deployer
              const { deploy, log } = deployments

              RaffleContract = await ethers.getContract("Raffle", deployer)
              ethersMoney = ethers.utils.parseEther("0.01")
              interval = await RaffleContract.get_interval()
          })

          describe("send money", async function () {
              it("send money just in case", async function () {
                  await new Promise(async (resolve, reject) => {
                      RaffleContract.once("No_winner", async () => {
                          resolve()
                          try {
                              console.log("No_winner")
                              const winner = await RaffleContract.get_address_winner()
                              const Number_winner = await RaffleContract.get_last_number_winner()

                              const state = await RaffleContract.get_state()
                              assert.equal(state.toString(), "0")
                          } catch (error) {
                              reject(error)
                          }
                      })
                  })
                  await RaffleContract.Buy_lottery("98", { value: ethersMoney })
                  console.log("someone enter")
              })
          })
      })
