pragma solidity >=0.5.0 <0.6.0;

contract Mating {
    struct GiveScore {
        address to;
        uint score;
    }

    struct ToolMan {
        uint toolCoin;
        uint serviceCoin;
        uint gender;
        uint datingPrice;
        uint[] servicePrice;
        string[] serviceContent;
        uint[] receivedDatingScore;
        uint[] receivedServiceScore;
        uint[] giveDaingScore;
        uint[] giveServiceScore;
        uint servicekind;
        string id;
    }

    uint contractAsset;
    uint contractServiceCoin;
    uint friendFee;
    uint maxScore;

    address payable contractOwner;
    address[] addressbook;

    mapping(address => ToolMan) toolman;
    mapping(address => bool) public isRegister;
    mapping(uint => uint) genderBonus;
    mapping(address => mapping(address => uint) ) friendRequest;
    mapping(address => mapping(address => bool) ) friends;
    mapping(address => mapping(address => bool) ) bedating;
    mapping(address => mapping(address => bool) ) beaskserving;

    event Registered(address indexed user);
    event getserviceoffer(address indexed toolman, string serviceContent, uint price);
    event cancellServiceOffer(address indexed toolman, string serviceContent, uint price);
    event callService(address indexed lazyman, address indexed toolman, uint servicenumber);
    event serviceAccepted(address indexed toolman, address indexed lazyman);
    event callDating(address indexed toolman);
    event datingAccepted(address indexed lazyman, address indexed toolman);
    event finishService(address indexed lazyman, address indexed toolman, string serviceContent, uint price, uint score);

    constructor() public payable {
        contractOwner = msg.sender;
        contractAsset = msg.value;
        contractServiceCoin = msg.value;
        genderBonus[0] = 10000;
        friendFee = 10;
        maxScore = 10;
    }

    function adjustContract(uint _friendFee, uint _maxScore) public {
        require(msg.sender == contractOwner);
        friendFee = _friendFee;
        maxScore = _maxScore;
    }

    function adjustGenderBonus(uint genderId, uint bonus) public {
        require(msg.sender == contractOwner);
        genderBonus[genderId] = bonus;
    }

    function withdrawToolman(uint amount) public payable {
        require(isRegister[msg.sender]);
        ToolMan storage me = toolman[msg.sender];
        require(amount <= me.serviceCoin);
        require(amount <= contractAsset);

        me.serviceCoin -= amount;
        contractAsset -= amount;
        msg.sender.transfer(amount);
    }


    function offerService(uint price, string memory _serviceContent) public {
        require(isRegister[msg.sender]);
        ToolMan storage offer = toolman[msg.sender];
        offer.servicePrice.push(price);
        offer.serviceContent.push(_serviceContent);
        offer.servicekind += 1;
        //Servicelistupdate();

        emit getserviceoffer (msg.sender, _serviceContent, price);

    }
    function cancellService(uint number) public{
        require(isRegister[msg.sender]);
        ToolMan storage offer = toolman[msg.sender];
        emit cancellServiceOffer (msg.sender, offer.serviceContent[number-1],offer.servicePrice[number-1]);
        offer.servicePrice[number-1] = offer.servicePrice[offer.servicekind-1];
        offer.serviceContent[number-1] = offer.serviceContent[offer.servicekind-1];
        offer.servicePrice.length -=1;
        offer.serviceContent.length -=1;
        offer.servicekind -= 1;
        // Servicelistupdate();
    }
    function callSpecificService (address _toolman, uint number) public{
        emit callService (msg.sender, _toolman, number);
    }
    function callSpecificDating (address addr) public{
        emit callDating(addr);
    }

    function datingAccept (address addrTool) public{
        bedating[msg.sender][addrTool]= true;
        emit datingAccepted(msg.sender, addrTool);
    }
    function serviceAccept (address lazyman) public{
        beaskserving[msg.sender][lazyman] = true;
        emit serviceAccepted(msg.sender, lazyman);
    }

    function serviceFinished(address addrTool, uint number, uint score) public {
        // msg.sender is lazyman
        require(beaskserving[addrTool][msg.sender] == true);
        beaskserving[addrTool][msg.sender] = false;
        require(isRegister[msg.sender]);
        require(isRegister[addrTool]);
        require(score <= maxScore);
        uint price;
        ToolMan storage sender = toolman[msg.sender];
        ToolMan storage tool = toolman[addrTool];
        price = tool.servicePrice[number-1];

        sender.serviceCoin -= price;
        sender.giveServiceScore.push(score);

        tool.toolCoin += price * score / maxScore;
        tool.serviceCoin += price - price * score / maxScore;
        tool.receivedServiceScore.push(score);
        emit finishService(msg.sender, addrTool, tool.serviceContent[number-1], price, score);
    }

    function abs(int val) private pure returns (uint) {
        if (val < 0) {
            return uint(val * -1) ;
        }
        return uint(val);
    }

    function datingFinished(address addrMate, uint hour, uint score) public {
        require(isRegister[msg.sender]);
        require(isRegister[addrMate]);
        require(bedating[addrMate][msg.sender] == true);
        bedating[addrMate][msg.sender] = false;
        require(score <= maxScore);
        ToolMan storage sender = toolman[msg.sender];
        ToolMan storage mate = toolman[addrMate];
        uint price;
        price = hour * mate.datingPrice;

        uint modifiedScore = 2 ** abs(int(score) - int(maxScore) / 2);
        require(sender.toolCoin >= price * modifiedScore);
        sender.toolCoin -= price * modifiedScore;
        sender.giveDaingScore.push(score);
        contractServiceCoin += price * (modifiedScore - 1);

        mate.serviceCoin += price;
        mate.receivedDatingScore.push(score);
    }

    function register(uint datingPrice, uint gender, string memory id) public payable{
        string memory non;
        non='';
        require(keccak256(abi.encodePacked(id)) != keccak256(abi.encodePacked(non)));
        require(!isRegister[msg.sender]);
        require(genderBonus[gender] <= contractServiceCoin);
        ToolMan storage tool = toolman[msg.sender];
        tool.datingPrice = datingPrice;
        tool.gender = gender;
        tool.id = id;
        tool.serviceCoin += genderBonus[gender] + msg.value;
        contractServiceCoin -= genderBonus[gender];
        contractAsset += msg.value;
        isRegister[msg.sender] = true;
       addressbook.push(msg.sender);
        //players += 1;
        emit Registered(msg.sender);
    }

    function addFriend(address addr, uint price) public {
        require(isRegister[msg.sender]);
        require(isRegister[addr]);
        require(friends[msg.sender][addr] == false);
        require(price >= friendFee);
        if (friendRequest[addr][msg.sender] > 0) {
            ToolMan storage accepter = toolman[msg.sender];
            //ToolMan storage sender = toolman[addr];
            accepter.serviceCoin += friendRequest[addr][msg.sender] - friendFee;
            contractServiceCoin -= friendRequest[addr][msg.sender] - friendFee;
            friendRequest[addr][msg.sender] = 0;
            friends[msg.sender][addr] = true;
            friends[addr][msg.sender] = true;

        } else {
            ToolMan storage sender = toolman[msg.sender];
            require(sender.toolCoin >= price);
            sender.toolCoin -= price;
            contractServiceCoin += price;
            friendRequest[msg.sender][addr] += price;
        }
    }

    function updateMyInfo(uint datingPrice) public {
        require(isRegister[msg.sender]);
        ToolMan storage tool = toolman[msg.sender];
        tool.datingPrice = datingPrice;
    }

    function getMateInfo(address addr) public view returns(uint nowisdating){
        uint i;
        nowisdating = 0;
        for (i=0;i<addressbook.length;i++){
            if(bedating[addr][addressbook[i]] == true){
                nowisdating += 1;
            }
        }
    }

    function getToolManInfo(address addr) public view returns (
        uint[] memory meanReceivedService,
        uint[] memory meanReceivedDating,
        uint[] memory meanGiveService ,
        uint[] memory meanGiveDating,
        uint datingPrice,
        uint gender,
        bool isfriend,
        uint bidFriendFee,
        string memory id
        ) {

        ToolMan storage tool = toolman[addr];
        meanReceivedService = tool.receivedServiceScore;
        meanReceivedDating = tool.receivedDatingScore;
        meanGiveService = tool.giveServiceScore;
        meanGiveDating = tool.giveDaingScore;
        datingPrice = tool.datingPrice;
        gender = tool.gender;
        isfriend = friends[msg.sender][addr];
        bidFriendFee = friendRequest[addr][msg.sender]; //疑似疑似寫反
        id=tool.id;
    }

    function getmyinfo() public view returns (
        uint serviceCoin, uint toolCoin) {
        ToolMan storage tool = toolman[msg.sender];
        serviceCoin = tool.serviceCoin;
        toolCoin = tool.toolCoin;
    }

    function getmyservice(uint number)public view returns(uint price, string memory content){
        ToolMan storage tool = toolman[msg.sender];
        price=tool.servicePrice[number-1];
        content=tool.serviceContent[number-1];
    }

    function getContractInfo() public view returns (
        uint serviceCoin, uint asset) {
        serviceCoin = contractServiceCoin;
        asset = contractAsset;
    }

    function buyServiceCoin(address dest) public payable {
        require(isRegister[dest]);
        ToolMan storage tool = toolman[dest];
        tool.serviceCoin += msg.value * 9 / 10;
        contractServiceCoin += msg.value - msg.value * 9 / 10;
        contractAsset += msg.value;
    }

    function buyContractService(uint amount) public payable {
        require(isRegister[msg.sender]);
        ToolMan storage tool = toolman[msg.sender];
        require(amount <= tool.toolCoin);
        tool.toolCoin -= amount;
        contractServiceCoin += amount;
    }

    // function ownerWithdraw(uint amount) public payable {
    //     require(amount <= contractAsset);
    //     contractOwner.transfer(amount);
    //     contractServiceCoin -= amount;
    //     contractAsset -= amount;
    // }

    function ownerTransfer(uint amount, address luckyman) public payable {
        require(isRegister[msg.sender]);
        require(msg.sender == contractOwner);
        require(amount <= contractServiceCoin);
        ToolMan storage tool = toolman[luckyman];
        tool.serviceCoin += amount;
        contractServiceCoin -= amount;
    }
}