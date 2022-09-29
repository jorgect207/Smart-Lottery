// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
//import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

//ERROR
error NO_ENOUGHT_MONEY();
error NO_OPEN_STATE();
error NO_SENDIG_STATE();
error NO_TIME();
error JUST_TwO_NUMBER();

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    //modifier
    modifier onlyOwner() {
        require(msg.sender == s_owner, "you are not owner");
        _;
    }

    //variable get ramdon number

    VRFCoordinatorV2Interface private immutable COORDINATOR;

    uint64 private s_subscriptionId;
    address private vrfCoordinator;
    bytes32 private keyHash;

    uint32 constant callbackGasLimit = 100000;
    uint16 constant requestConfirmations = 3;

    uint32 private numWords;

    uint256[] public s_randomWords;
    uint256 public s_requestId;
    address private s_owner;
    uint256 private s_lastTimeStamp;
    uint256 public interval;

    //ENUM
    enum raffle_State {
        OPEN,
        SENDIG
    }

    //EVENTS
    event new_ticket(address buyer);
    event new_winner(address winner);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event No_winner(uint256 No_winner);
    event staring(bool start);

    //VARIABLES

    struct Lottery {
        address address_person;
        uint256 number_of;
    }

    mapping(address => uint256) public players;

    Lottery[] public players_array;
    Lottery[] public winners;

    uint256 private time_batch;
    raffle_State public State;
    address[] public address_w;

    uint256 public ticket_winner;
    uint256 public number;

    constructor(
        uint32 num_winners,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _s_subscriptionId,
        uint256 _interval
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        State = raffle_State.OPEN;
        numWords = num_winners;
        vrfCoordinator = _vrfCoordinator;
        keyHash = _keyHash;
        s_owner = msg.sender;
        s_subscriptionId = _s_subscriptionId;
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_lastTimeStamp = block.timestamp;
        interval = _interval;
    }

    //get into the lottery

    function Buy_lottery(uint256 _number) external payable {
        if (_number <= 1) {
            revert JUST_TwO_NUMBER();
        }
        if (_number >= 99) {
            revert JUST_TwO_NUMBER();
        }
        if (msg.value < 0.01 ether) {
            revert NO_ENOUGHT_MONEY();
        }
        if (raffle_State.OPEN != State) {
            revert NO_OPEN_STATE();
        }
        players_array.push(Lottery({address_person: msg.sender, number_of: _number}));
        players[msg.sender] = _number;
        emit new_ticket(msg.sender);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (State == raffle_State.OPEN);
        bool isTime = ((block.timestamp - s_lastTimeStamp) > interval);
        //bool isMoney = (address(this).balance > 0.01 ether);
        upkeepNeeded = (isOpen && isTime);
    }

    //chose a winer gettin a ramdom number
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert NO_TIME();
        }
        s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        State = raffle_State.SENDIG;
        emit RequestedRaffleWinner(s_requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        emit staring(true);
        State = raffle_State.OPEN;
        s_randomWords = randomWords;
        ticket_winner = randomWords[0] % players_array.length;
        uint256 value_share = 1 * 10**18;
        (bool money, ) = payable(players_array[ticket_winner].address_person).call{
            value: value_share
        }("");
        require(money, "ether not send");

        emit new_winner(players_array[ticket_winner].address_person);
        State = raffle_State.OPEN;
    }

    //send the money and restart

    function get_num_winners() public view returns (uint256) {
        return numWords;
    }

    function get_address_winner() public view returns (address) {
        return address_w[number];
    }

    function get_last_number_winner() public view returns (uint256) {
        return ticket_winner;
    }

    function get_interval() public view returns (uint256) {
        return interval;
    }

    function get_state() public view returns (raffle_State) {
        return State;
    }

    function get_wallet(uint256 index) public view returns (address) {
        return players_array[index].address_person;
    }

    function get_num(uint256 index) public view returns (uint256) {
        return players_array[index].number_of;
    }
}
