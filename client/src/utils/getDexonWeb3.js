import Web3 from "web3";

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...

      // const DEXON_TESTNET_ID = 238;
      // const WS_PROVIDER = () => {
      //   // if (window.ethereum) {
      //   //   return `ws://${window.location.hostname}:8545`;
      //   // }
      //   return (window.location.hostname === 'localhost')
      //   ? 'ws://testnet.dexon.org:8546'
      //   : 'wss://ws-proxy.dexon.org';
      // };

      // const INJECTED = window.dexon || window.ethereum;

      // console.log(window.dexon);


      // // this.web3 = await  import(/* webpackChunkName: "web3" */'web3');
      // if (!INJECTED) {
      //   alert('Please install DekuSan Wallet');
      //   return;
      // }
      // this.walletHandler = new this.web3.default(INJECTED);
      // const netId = await this.getNetworkId();
      // if (
      //   (netId !== DEXON_TESTNET_ID) &&
      //   (window.location.hostname !== 'localhost')
      // ) {
      //   alert('Please Select "DEXON Test Network" in DekuSan wallet');
      //   return;
      // }
      // this.wsHandler = new this.web3.default(WS_PROVIDER());
      // this.initDone = true;


      if (window.dexon) {
        const web3 = new Web3(window.dexon);
        try {
          // Request account access if needed
          await window.dexon.enable();
          // Acccounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const provider = new Web3.providers.HttpProvider(
          "http://127.0.0.1:9545"
        );
        const web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3);
      }
    });
  });

export default getWeb3;
