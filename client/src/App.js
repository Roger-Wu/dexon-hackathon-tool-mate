import React, { Component } from "react";
// import Select from 'react-select';
// import { BigNumber } from 'bignumber.js'; // not web3.utils.BN
// import SimpleStorageContract from "./contracts/SimpleStorage.json";
import MatingJSON from "./contracts/Mating.json";
import getWeb3 from "./utils/getWeb3";
import genders from "./utils/genders";
// import truffleContract from "truffle-contract";


// import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
// import { parse } from "querystring";

class App extends Component {
  state = {
    storageValue: 0, web3: null, accounts: null, contract: null,
    contractInfo: {
      serviceCoin: "0",
      asset: "0",
    },
    userInfo: {
      isRegister: false,
    },
    myInfo: {
      serviceCoin: "0",
      toolCoin: "0",
    },
    registeredUsers: [],
    toolManInfos: [],
    addressToToolManInfo: {},
    selectedGender: 0,
    addressToServices: {},
    myServiceRequests: [],
    isShowingService: true,
    isShowingSentService: true,
    mySentServiceRequests: [],
    myAcceptedSentServiceRequest: [],
    // toolManInfoDict: {},
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // // Get the contract instance.
      // const Contract = truffleContract(SimpleStorageContract);
      // Contract.setProvider(web3.currentProvider);
      // const instance = await Contract.deployed();

      // Get the contract instance.
      const instance = new web3.eth.Contract(MatingJSON.abi, MatingJSON.networks['238'].address);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, () => {
        this.fetchContractInfo();
        this.fetchRegisterInfo();
        this.fetchRegisteredUser();
        this.fetchServices();
        this.fetchMyServiceRequest();
        this.fetchMySentServiceRequest();
        this.fetchMyAcceptedSentServiceRequest();
        this.fetchMyInfo();
        // this.fetchMyToolmanInfo();

        setInterval(() => {
          this.fetchContractInfo();
          this.fetchRegisterInfo();
          this.fetchRegisteredUser();
          this.fetchServices();
          this.fetchMyServiceRequest();
          this.fetchMySentServiceRequest();
          this.fetchMyAcceptedSentServiceRequest();
          this.fetchMyInfo();

        }, 3000);
      });

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  fetchContractInfo = async () => {
    const { contract } = this.state;

    // Stores a given value, 5 by default.
    // await contract.set(5, { from: accounts[0] });

    // // Get the value from the contract to prove it worked.
    const contractInfo = await contract.methods.getContractInfo().call(); // string
    console.log("contractInfo", contractInfo);

    // const responseBN = new BigNumber(response);

    // // Update state with the result.
    this.setState({ contractInfo });
  };

  fetchRegisterInfo = async () => {
    const { accounts, contract } = this.state;

    if (this.state.userInfo.isRegister) {
      return;
    }

    if (accounts.length === 0) {
      return;
    }

    const isRegister = await contract.methods.isRegister(accounts[0]).call(); // string
    console.log("isRegister", isRegister);

    const userInfo = {
      isRegister: isRegister,
    };

    this.setState({ userInfo });
  };


  fetchMyInfo = async () => {
    const { accounts, contract } = this.state;

    // if (!this.state.userInfo.isRegister) {
    //   return;
    // }

    if (accounts.length === 0) {
      return;
    }

    const myInfo = await contract.methods.getmyinfo().call({
      from: accounts[0]
    }); // string
    console.log("myInfo", myInfo);

    this.setState({ myInfo });
  };


  // fetchMyToolmanInfo = async () => {
  //   const { accounts, contract } = this.state;

  //   if (accounts.length === 0) {
  //     return;
  //   }

  //   const toolManInfo = await contract.methods.getToolManInfo(accounts[0]).call({
  //     from: accounts[0]
  //   }); // string
  //   console.log("toolManInfo", toolManInfo);

  //   // const userInfo = {
  //   //   isRegister: isRegister,
  //   // };

  //   // this.setState({ userInfo });
  // };

  fetchRegisteredUser = async () => {
    const { accounts, contract } = this.state;

    // contract.getPastEvents('Registered', {
    //   fromBlock: 624677,
    //   toBlock: 'latest'
    // }, function(error, events){
    //   console.log("error", error);
    //   console.log("events", events);
    // });

    const registeredEvents = await contract.getPastEvents('Registered', {
      fromBlock: 624677,
      toBlock: 'latest'
    });
    // , function(error, events){ console.log(events); }

    console.log("registeredEvents", registeredEvents);

    let registeredUsers = [];
    for (const event of registeredEvents) {
      registeredUsers.push(event.returnValues.user);
    }

    // // if no new registered user, return;
    // if (registeredUsers.length === this.state.registeredUsers.length) {
    //   return;
    // }

    // fetchAllToolManInfo

    const getToolManInfoPromises = registeredUsers.map(addr => {
      return contract.methods.getToolManInfo(addr).call({
        from: accounts[0]
      });
    });
    const toolManInfos = await Promise.all(getToolManInfoPromises);

    console.log("toolManInfos", toolManInfos);


    let addressToToolManInfo = {};

    for (let i = 0; i < registeredUsers.length; i++) {
      const addr = registeredUsers[i].toString();
      addressToToolManInfo[addr] = toolManInfos[i];
    }

    console.log("addressToToolManInfo", addressToToolManInfo);

    this.setState({
      registeredUsers,
      toolManInfos,
      addressToToolManInfo,
    });
  };

  fetchServices = async () => {
    const { contract } = this.state;

    // contract.getPastEvents('Registered', {
    //   fromBlock: 624677,
    //   toBlock: 'latest'
    // }, function(error, events){
    //   console.log("error", error);
    //   console.log("events", events);
    // });

    const offeredServices = await contract.getPastEvents('getserviceoffer', {
      fromBlock: 624677,
      toBlock: 'latest'
    });
    // , function(error, events){ console.log(events); }

    console.log("offeredServices", offeredServices);
    let addressToServices = {};
    for (const serviceEvent of offeredServices) {
      const toolman = serviceEvent.returnValues.toolman;
      if (!addressToServices.hasOwnProperty(toolman)) {
        addressToServices[toolman] = [];
      }
      addressToServices[toolman].push({
        serviceContent: serviceEvent.returnValues.serviceContent,
        price: serviceEvent.returnValues.price,
      });
    }

    this.setState({
      addressToServices,
    })
  };


  fetchMyServiceRequest = async () => {
    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    console.log("fetchMyServiceRequest");

    const myServiceRequests = await contract.getPastEvents('callService', {
      filter: {toolman: accounts[0]},
      fromBlock: 624677,
      toBlock: 'latest'
    });
    // , function(error, events){ console.log(events); }

    console.log("myServiceRequests", myServiceRequests);

    this.setState({
      myServiceRequests
    })
  }

  fetchMyAcceptedSentServiceRequest = async () => {
    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    console.log("fetchMyAcceptedSentServiceRequest");

    const myAcceptedSentServiceRequest = await contract.getPastEvents('serviceAccepted', {
      filter: {lazyman: accounts[0]},
      fromBlock: 624677,
      toBlock: 'latest'
    });
    // , function(error, events){ console.log(events); }

    console.log("myAcceptedSentServiceRequest", myAcceptedSentServiceRequest);

    this.setState({
      myAcceptedSentServiceRequest,
    })
  }

  fetchMySentServiceRequest = async () => {
    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    console.log("fetchMySentServiceRequest");

    const mySentServiceRequests = await contract.getPastEvents('callService', {
      filter: {lazyman: accounts[0]},
      fromBlock: 624677,
      toBlock: 'latest'
    });
    // , function(error, events){ console.log(events); }

    console.log("mySentServiceRequests", mySentServiceRequests);

    this.setState({
      mySentServiceRequests
    });
  }

  // fetchAllToolManInfo = async (addr) => {
  //   const { accounts, contract, registeredUsers } = this.state;

  //   if (accounts.length === 0) {
  //     return;
  //   }

  //   if (registeredUsers.length === 0) {
  //     return;
  //   }

  //   const getToolManInfoPromises = registeredUsers.map(addr => {
  //     return contract.methods.getToolManInfo(addr).call({
  //       from: accounts[0]
  //     });
  //   });

  //   const toolManInfos = await Promise.all(getToolManInfoPromises);
  //   console.log("toolManInfos", toolManInfos);

  //   let toolManInfoDict = {};


  //   // for (const addr of registeredUsers) {
  //   //   contract.methods.getToolManInfo(addr).call({
  //   //     from: accounts[0]
  //   //   })
  //   // }

  //   // const toolManInfo = await contract.methods.getToolManInfo(addr).call({
  //   //   from: accounts[0]
  //   // }); // string
  //   // console.log("toolManInfo", toolManInfo);

  //   // const userInfo = {
  //   //   isRegister: isRegister,
  //   // };

  //   // this.setState({ userInfo });
  // };

  handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    const datingPriceInputStr = this.refs.datingPriceInput.value; // string
    const genderInput = this.refs.genderInput.value; // string
    const idInput = this.refs.idInput.value; // string

    const datingPrice = parseInt(datingPriceInputStr);
    let gender = 0;
    if (genderInput == 1 || genderInput == "男") {
      gender = 1;
    }
    // const gender = parseInt(genderInput);

    contract.methods.register(datingPrice, gender, idInput).send({ from: accounts[0] })
    .once('transactionHash', (hash) => {
      console.log('once transactionHash', hash);

      // const intervalId = setInterval(() => {
      //   this.fetchRegisterInfo();
      // }, 2000);
      // setTimeout(() => {
      //   clearInterval(intervalId);
      // }, 20000);

    })
    .once('error', function(error){
      console.log('once error', error);
    })
    .then(function(receipt){
      // will be fired once the receipt is mined
      console.log("then receipt", receipt);
    });
  };

  handleOfferServiceSubmit = async (event) => {
    event.preventDefault();

    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    const serviceContentInputStr = this.refs.serviceContentInput.value; // string
    const servicePriceInputStr = this.refs.servicePriceInput.value; // string

    const servicePrice = parseInt(servicePriceInputStr);

    contract.methods.offerService(servicePrice, serviceContentInputStr).send({ from: accounts[0] })
    .once('transactionHash', function(hash){
      console.log('once transactionHash', hash);
    })
    .once('error', function(error){
      console.log('once error', error);
    })
    .then(function(receipt){
      // will be fired once the receipt is mined
      console.log("then receipt", receipt);
    });
  };

  callSpecificService = async(addr, number) => {
    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    contract.methods.callSpecificService(addr, number).send({ from: accounts[0] })
    .once('transactionHash', (hash) => {
      console.log('once transactionHash', hash);
    })
    .once('error', function(error){
      console.log('once error', error);
    })
    .then(function(receipt){
      // will be fired once the receipt is mined
      console.log("then receipt", receipt);
    });
  }

  serviceAccept = async (lazyman) => {
    const { accounts, contract } = this.state;

    if (accounts.length === 0) {
      return;
    }

    contract.methods.serviceAccept(lazyman).send({ from: accounts[0] })
    .once('transactionHash', (hash) => {
      console.log('once transactionHash', hash);
      setTimeout(() => {
        this.setState({
          isShowingService: false,
        });
      }, 3000);
    })
    .once('error', function(error){
      console.log('once error', error);
    })
    .then(function(receipt){
      // will be fired once the receipt is mined
      console.log("then receipt", receipt);
    });
  };

  serviceReject = async (lazyman) => {
    this.setState({
      isShowingService: false,
    });
  }

  handleGiveScore = async (event) => {
    event.preventDefault();

    // serviceFinished(address addrTool, uint number, uint score)

    const { accounts, contract, mySentServiceRequests } = this.state;

    if (accounts.length === 0) {
      return;
    }

    const scoreInputStr = this.refs.scoreInput.value; // string

    const score = parseInt(scoreInputStr);

    // console.log("mySentServiceRequests[0].returnValues.toolman", mySentServiceRequests[0].returnValues.toolman);

    contract.methods.serviceFinished(mySentServiceRequests[0].returnValues.toolman, 1, score).send({ from: accounts[0] })
    .once('transactionHash', (hash) => {
      console.log('once transactionHash', hash);

      setTimeout(() => {
        this.setState({
          isShowingSentService: false,
        });
      }, 3000);
    })
    .once('error', function(error){
      console.log('once error', error);
    })
    .then(function(receipt){
      // will be fired once the receipt is mined
      console.log("then receipt", receipt);
    });

  };

  getName = (addr) => {
    let name = "";
    try {
      name = this.state.addressToToolManInfo[addr].id;
    } catch (error) {}
    return name;
  };

  getServiceContent = (addr, index) => {
    console.log("getServiceContent");
    console.log("addr", "index", addr, index);
    let content = "";
    try {
      content = this.state.addressToServices[addr][index].serviceContent;
    } catch (error) {}
    return content;
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <div className="App">
        <nav className="navbar navbar-light navbar-dark bg-primary mb-4"
        // style={{"backgroundColor": "#4267b2"}}
        >
          <span className="navbar-brand mb-0 h1">Tool Mate 工具人交友</span>
        </nav>

        <div className="container">

          {/* if not registered */}

          {(!this.state.userInfo.isRegister) && <div>
            <div className="card narrow-form-container">
              <div className="card-body">
                <div className="text-left">
                  <h3 className="text-center">註冊</h3>
                  <form onSubmit={this.handleRegisterSubmit}>

                    <fieldset className="form-group">
                      <label htmlFor="idInput" className="bmd-label-floating">暱稱</label>
                      <input type="text" className="form-control" id="idInput" ref="idInput" />
                      <span className="bmd-help"></span>
                    </fieldset>

                    <fieldset className="form-group">
                      <label htmlFor="genderInput" className="bmd-label-floating">性別</label>
                      <input type="text" className="form-control" id="genderInput" ref="genderInput" />
                      <span className="bmd-help">0: female, 1: male, </span>
                    </fieldset>

                    <fieldset className="form-group">
                      <label htmlFor="datingPriceInput" className="bmd-label-floating">約會價格（工具人幣）</label>
                      <input type="text" className="form-control" id="datingPriceInput" ref="datingPriceInput" />
                    </fieldset>

                    <div className="text-center">
                      <button type="submit" className="btn btn-primary btn-raised">註冊</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>}

          {/* if registered */}

          {(this.state.userInfo.isRegister) && <div>

          <div>
            {/* <h3>Contract Info</h3>
            <div>serviceCoin: {this.state.contractInfo.serviceCoin}</div>
            <div>asset: {this.state.contractInfo.asset}</div>

            <h3>User Info</h3>
            <div>isRegister: {this.state.userInfo.isRegister.toString()}</div> */}

            <h3>我的帳戶</h3>
            <div className="mb-5 card narrow-form-container ">
              <div className="card-body">
                <div></div>
                <h4>我是 {this.getName(this.state.accounts[0])}</h4>
                <h4>{this.state.myInfo.serviceCoin} 萬用幣</h4>
                <h4>{this.state.myInfo.toolCoin} 工具人幣</h4>
              </div>
            </div>

            <div className="mb-5">
              <div className="">
                <h3>別人要求我提供服務</h3>

                {(!this.state.isShowingService || (this.state.myServiceRequests.length === 0)) &&
                  <h4 className="text-muted">目前沒有服務要求</h4>
                }

                {this.state.isShowingService && this.state.myServiceRequests.map((event, index) => {
                  return <div className="card narrow-form-container mb-3">
                    <div className="card-body" key={"service-request-" + index}>
                      <h5>
                        {/* 要求者：{
                          (!!this.state.addressToToolManInfo) &&
                          (!!event.returnValues.lazyman) &&
                          JSON.stringify(this.state.addressToToolManInfo)
                          // this.state.addressToToolManInfo[(event.returnValues.lazyman.toString())].id
                        } */}
                      </h5>
                      <h5>
                        要求者：{this.getName(event.returnValues.lazyman)}
                        {/* 要求者： {(!!this.state.addressToToolManInfo) && this.state.addressToToolManInfo[ event.returnValues.lazyman ].id} */}
                      </h5>
                      <h5>
                        {/* {JSON.stringify(this.state.addressToServices)} */}
                        服務內容：{this.getServiceContent(event.returnValues.toolman, parseInt(event.returnValues.servicenumber))}

                        {/*
                          !!this.state.addressToServices &&
                          !!event.returnValues.toolman &&
                          this.state.addressToServices[event.returnValues.toolman.toString()][
                            // parseInt(event.returnValues.servicenumber)
                            0
                          ].serviceContent
                        */}
                      </h5>
                      <div>
                        <button onClick={() => {this.serviceAccept(event.returnValues.lazyman)}} className="btn btn-primary btn-raised mr-3">接受</button>
                        <button onClick={() => {this.serviceReject(event.returnValues.lazyman)}} className="btn btn-danger btn-raised">拒絕</button>
                      </div>
                    </div>

                  </div>;
                })}
              </div>
            </div>

            <div className="mb-5">
              <h3>我要求別人提供服務</h3>
                {(!this.state.isShowingSentService || this.state.mySentServiceRequests.length === 0) &&
                  <h4 className="text-muted">目前沒有服務要求</h4>
                }

                {this.state.isShowingSentService && this.state.mySentServiceRequests.map((event, index) => {
                  return <div className="card narrow-form-container mb-3">
                    <div className="card-body" key={"service-request-" + index}>
                      <h5>
                        {/* 工具人：{event.returnValues.toolman} */}
                        工具人：{this.getName(event.returnValues.toolman)}
                      </h5>
                      <h5>
                        服務內容：{this.getServiceContent(event.returnValues.toolman, parseInt(event.returnValues.servicenumber))}
                      </h5>

                      { this.state.myAcceptedSentServiceRequest.length > 0 &&
                        <div class="mt-3">
                          <form onSubmit={this.handleGiveScore}>
                            <fieldset className="form-group">
                              <label htmlFor="scoreInput" className="">評分（滿分 10 分）</label>
                              <input type="text" className="text-center form-control" id="scoreInput" ref="scoreInput" />
                              <div>你的評分會決定對方獲得的工具人幣數量</div>
                            </fieldset>

                            <div className="text-center">
                              <button type="submit" className="btn btn-primary btn-raised">上傳評分</button>
                            </div>
                          </form>
                        </div>
                      }

                    </div>

                  </div>;
                })}
            </div>

            <h3>我能提供什麼服務？</h3>
            <div className="card narrow-form-container mb-5">
              <div className="card-body">
                <div className=" text-left">
                  <form onSubmit={this.handleOfferServiceSubmit}>

                    <fieldset className="form-group">
                      <label htmlFor="serviceContentInput" className="bmd-label-floating">服務內容</label>
                      <input type="text" className="form-control" id="serviceContentInput" ref="serviceContentInput" />
                    </fieldset>

                    <fieldset className="form-group">
                      <label htmlFor="servicePriceInput" className="bmd-label-floating">價格（萬用幣）</label>
                      <input type="text" className="form-control" id="servicePriceInput" ref="servicePriceInput" />
                    </fieldset>

                    <div className="text-center">
                      <button type="submit" className="btn btn-primary btn-raised">提供服務</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <h3>工具人列表</h3>

            <table className="table">
              <thead>
                <tr>
                  {/* <th scope="col">#</th> */}
                  <th scope="col">頭像</th>
                  {/* <th scope="col">Address</th> */}
                  <th scope="col">暱稱</th>
                  <th scope="col">性別</th>
                  <th scope="col">約會價格</th>
                  <th scope="col">平均服務評分</th>
                  <th scope="col">提供服務</th>
                  {/* <th scope="col">是朋友</th> */}
                </tr>
              </thead>
              <tbody>
                { this.state.registeredUsers.map((user, index) => {
                  return <tr key={"toolman-" + index}>
                    {/* <th key={"toolman-index-" + index} scope="row">{index}</th> */}
                    <td key={"toolman-photo-" + index}>
                      {
                        (this.state.toolManInfos[index].gender == 0) ?
                        <img
                          src="https://lh3.googleusercontent.com/-X101O8wMJRF12kOkL8pEAYvKI098dM1YWXd6yioBEkdnuNz-ocM-OaNGKo1pmHtQabwPVgH-xGC0MVEjC_nS8Mt8mTjVsVje6yq9K8Sxc4xI9cfYkp_Za-3s-f2MAwv9R9QjlWy"
                          alt="avatar"
                          width="64"
                        />
                        :
                        <img
                          src="https://i.imgur.com/DePiwvi.png"
                          alt="avatar"
                          width="64"
                        />
                      }
                    </td>

                    {/* <td key={"toolman-address-" + index}>{user}</td> */}
                    <td key={"toolman-id-" + index}>{this.state.toolManInfos[index].id}</td>
                    <td key={"toolman-gender-" + index}>{genders[this.state.toolManInfos[index].gender]}</td>
                    <td key={"toolman-price-" + index}>{this.state.toolManInfos[index].datingPrice}</td>
                    <td key={"toolman-score-" + index}>{(this.state.toolManInfos[index].meanReceivedService.length > 0)? this.state.toolManInfos[index].meanReceivedService[0] : "-"}</td>
                    {/* <td key={"toolman-isFriend-" + index}>{this.state.toolManInfos[index].isfriend.toString()}</td> */}
                    <td key={"toolman-services-" + index}>
                      {
                        !!this.state.addressToServices[user] &&
                        this.state.addressToServices[user].map((service, serviceIndex) => {
                          return <div key={"service-" + serviceIndex} className="card mb-2"><div className="card-body">
                            <div className="h5">
                              {service.serviceContent}
                            </div>
                            <div className="h6">
                              {service.price} 萬用幣
                            </div>
                            <button type="submit" className="btn btn-primary btn-raised" onClick={() => {this.callSpecificService(user, serviceIndex)}}>
                              要求服務
                            </button>
                          </div></div>;
                        })
                      }
                    </td>

                  </tr>
                }) }
                {/* <tr>
                  <th scope="row">1</th>
                  <td>Mark</td>
                  <td>Otto</td>
                  <td>@mdo</td>
                </tr> */}
              </tbody>
            </table>

            {/* this.state.registeredUsers.map((user, index) => {
              return <div>
                <div key={"user" + index}>{user}</div>
                <div key={"toolmaninfo" + index}>{ JSON.stringify(this.state.toolManInfos[index])}</div>
              </div>
            }) */}

          </div>

          </div>}
          {/* end if registered */}

        </div>

      </div>
    );
  }
}

export default App;
