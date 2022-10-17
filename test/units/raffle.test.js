const { assert, expect } = require("chai")
const { randomBytes } = require("ethers/lib/utils")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentNetwork, networkConfig } = require("../../helper-hardhat-config")

!developmentNetwork.includes(network.name)
    ? describe.skip
    : describe("all project", async function () {
          let VRFContract, RaffleContract, deployer, interval
          const chainId = network.config.chainId
          function getRandomArbitrary(min, max) {
              return Math.random() * (max - min) + min
          }

          beforeEach("deployments", async function () {
              deployer = (await getNamedAccounts()).deployer
              const { deploy, log } = deployments

              await deployments.fixture(["all"])
              VRFContract = await ethers.getContract("VRFCoordinatorV2Mock")
              RaffleContract = await ethers.getContract("Raffle")
              ethersMoney = ethers.utils.parseEther("0.01")
              interval = await RaffleContract.get_interval()
          })

          describe("constructor", async function () {
              it("check number of winners", async function () {
                  const Get_winner = await RaffleContract.get_num_winners()
                  assert.equal(Get_winner.toString(), "1")
              })

              it("check interval", async function () {
                  const Get_interval = await RaffleContract.get_interval()
                  assert.equal(Get_interval.toString(), networkConfig[chainId]["interval"])
              })

              it("check state", async function () {
                  const Get_state = (await RaffleContract.get_state()).toString()
                  assert.equal(Get_state, "0")
              })
          })

          describe("check buy_lottery", async function () {
              it(" no enought money", async function () {
                  await expect(RaffleContract.Buy_lottery("13")).to.be.revertedWith(
                      "NO_ENOUGHT_MONEY"
                  )
              })
              it("players array", async function () {
                  await RaffleContract.Buy_lottery("12", { value: ethersMoney })
                  const get_player = await RaffleContract.get_wallet(0)
                  assert.equal(get_player, deployer)
              })
              it("players num", async function () {
                  await RaffleContract.Buy_lottery("43", { value: ethersMoney })
                  const get_player = await RaffleContract.get_num(0)
                  assert.equal(get_player, "43")
              })
              it("emit the event", async function () {
                  await expect(RaffleContract.Buy_lottery("43", { value: ethersMoney })).to.emit(
                      RaffleContract,
                      "new_ticket"
                  )
              })
              it("no enter in the raffle", async function () {
                  await RaffleContract.Buy_lottery("24", { value: ethersMoney })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 4])
                  await network.provider.send("evm_mine", [])
                  //await network.provider.request({ method: "evm_mine", params: [] })
                  await RaffleContract.performUpkeep([])
                  await expect(
                      RaffleContract.Buy_lottery("24", { value: ethersMoney })
                  ).to.be.revertedWith("NO_OPEN_STATE")
              })
          })

          describe("proving checkepper", async function () {
              it("proving false no time", async function () {
                  await RaffleContract.Buy_lottery("35", { value: ethersMoney })
                  const { upkeepNeeded } = await RaffleContract.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })

              it("proving false no state open", async function () {
                  await RaffleContract.Buy_lottery("35", { value: ethersMoney })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 4])
                  await network.provider.send("evm_mine", [])
                  //await network.provider.request({ method: "evm_mine", params: [] })
                  await RaffleContract.performUpkeep([])
                  const { upkeepNeeded } = await RaffleContract.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })

              it("its good ", async function () {
                  await RaffleContract.Buy_lottery("35", { value: ethersMoney })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 4])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await RaffleContract.callStatic.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
          })

          describe("PROVING perfom unkeep", function () {
              it("prove no time error", async function () {
                  await expect(RaffleContract.performUpkeep([])).to.be.revertedWith("NO_TIME")
              })
              it("proving state", async function () {
                  await RaffleContract.Buy_lottery("98", { value: ethersMoney })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await RaffleContract.performUpkeep([])
                  const state = await RaffleContract.get_state()
                  assert.equal(state, 1)
              })
          })

          describe("sending money", function () {
              beforeEach(async () => {
                  await RaffleContract.Buy_lottery("32", { value: ethersMoney })

                  let accounts = await ethers.getSigners()
                  for (let i = 2; i < 5; i++) {
                      let newplayers = await RaffleContract.connect(accounts[i])
                      await newplayers.Buy_lottery(Math.floor(Math.random() * 20).toString(), {
                          value: ethersMoney,
                      })
                  }

                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 10])
                  await network.provider.send("evm_mine", [])
              })

              it("proving mock string", async () => {
                  const tx = await RaffleContract.performUpkeep([])
                  const tx_receipt = await tx.wait()
                  const tx_string = tx_receipt.events[1].args.requestId
                  console.log(tx_string.toString())
                  await expect(
                      VRFContract.fulfillRandomWords(tx_string, RaffleContract.address)
                  ).to.emit(VRFContract, "RandomWordsFulfilled")
              })

              it("proving mock perform", async () => {
                  await expect(RaffleContract.performUpkeep([])).to.emit(
                      VRFContract,
                      "RandomWordsRequested"
                  )
              })

              it("proving ticket winner event", async () => {
                  const tx = await RaffleContract.performUpkeep([])
                  const tx_receipt = await tx.wait()
                  const tx_string = await tx_receipt.events[1].args.requestId
                  console.log(tx_string.toString())

                  await expect(
                      VRFContract.fulfillRandomWords(tx_string, RaffleContract.address)
                  ).to.emit(RaffleContract, "new_winner")
              })

              it("can only be called after performupkeep", async () => {
                  const tx = await RaffleContract.performUpkeep([])
                  const tx_receipt = await tx.wait()
                  const tx_string = tx_receipt.events[1].args.requestId
                  console.log(tx_string.toString())

                  await VRFContract.fulfillRandomWords(tx_string, RaffleContract.address)

                  const State = await RaffleContract.get_state()
                  assert.equal(State, 0)
              })

              it("proving ticket_winner", async function () {
                  const tx = await RaffleContract.performUpkeep([])
                  const tx_receipt = await tx.wait()
                  const tx_string = await tx_receipt.events[1].args.requestId

                  await VRFContract.fulfillRandomWords(tx_string, RaffleContract.address)

                  const ticket_winner = await RaffleContract.get_last_number_winner()
                  console.log(ticket_winner.toNumber())

                  assert.equal(ticket_winner.toString(), "32")
              })

              it("send money just in case", async function () {
                  await new Promise(async (resolve, reject) => {
                      RaffleContract.once("new_winner", async () => {
                          resolve()
                          try {
                              console.log("new_winner")
                              //   const get_balance_2 = await accounts[0].getBalance()
                              const State = await RaffleContract.get_state()
                              assert.equal(State.toString(), "0")
                              //   assert.isBelow(get_balance_1, get_balance_2)
                          } catch (error) {
                              reject(error)
                          }
                      })
                      const get_balance_1 = await accounts[0].getBalance()

                      const tx = await RaffleContract.performUpkeep("0x")
                      const tx_receipt = await tx.wait()
                      const tx_string = await tx_receipt.events[1].args.requestId

                      await VRFContract.fulfillRandomWords(tx_string, RaffleContract.address)
                  })
              })
          })
      })
