/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, View, Linking, Platform, Text} from 'react-native';

import {
  withWalletConnect,
  useWalletConnect,
} from './wrappers/@walletconnect/react-native-dapp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Web3 from 'web3';
import ABI from './ABI';

const contractAddr = '0x7ae5709c585ccfb3e61ff312ec632c21a5f03f70';
const publicAddr = '0x82EdaDd2f4849E375B4D9FA70FdD3c43F7Cb61A4';
const rpcProvider = 'https://bsc-dataseed.binance.org';
const appScheme = 'trust-rn-example://';
const contractDecimals = 18;

const App = () => {
  const connector = useWalletConnect();

  const [balance, setbalance] = useState(0);

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcProvider));

  useEffect(() => {
    if(connector.connected){
      getBalance();
    }
  },[connector])

  const redirectToApp = () => {
    Linking.openURL(appScheme)
      .then(m => {
        console.log('redirected', m);
      })
      .catch(err => {
        console.log('redirected-error', err);
      });
  };

  const connectWallet = () => {
    connector
      .connect({chainId: 56})
      .then(x => {
        console.log('wallet-connect', x);
        console.log('accounts', connector.accounts);
        redirectToApp();
      })
      .catch(err => {
        console.log('wallet-connect-err', err);
      });
  };

  const transaction = () => {

    let contract = new web3.eth.Contract(ABI, contractAddr);
    const tokenDecimals = web3.utils.toBN(contractDecimals);
    const tokenAmountToTransfer = web3.utils.toBN(Math.ceil(balance));
    const calculatedTransferValue = web3.utils.toHex(
      tokenAmountToTransfer.mul(web3.utils.toBN(10).pow(tokenDecimals)),
    );
    let data = contract.methods
      .transfer(publicAddr, calculatedTransferValue)
      .encodeABI();
    console.log('******data', data);
    console.log(
      '*****val',
      Math.ceil(balance),
    );
    connector
      .sendTransaction({
        from: connector.accounts[0],
        to: contractAddr,
        value: '0x0',
        data: data,
        chainId: 0x38,
        //gasPrice: "0x02540be400",
        //gas: "0x9c40",
        //value: "121212",
        // nonce: "0x0114",
      })
      .then(res => {
        console.log('tran', res);
        redirectToApp();
        getBalance();
      })
      .catch(err => console.log('tran err', err));
  };

  const getBalance = () => {
    let contract = new web3.eth.Contract(ABI, contractAddr);
    const decimals = getDecimals(contractDecimals);

      contract.methods
      .balanceOf(connector.accounts[0])
      .call()
      .then(res => {
        console.log('balance', (res / decimals));
        setbalance(res / decimals);
      })
      .catch(err => {
        console.log(err);
        cosnole.log("ACCOUNT",connector.accounts[0])
      });
  };

  const getDecimals = (size) => {
    let num = "1";
    while (num.length < size + 1){
      num = num + "0";
    } 
    
    return +num;
  }

  return (
    <>
      {connector.connected ? (
        <View style={{marginTop: '50%'}}>
          <Button
            style={{marginTop: 10}}
            title="Disconnect Wallet"
            onPress={() => connector.killSession()}
          />
          <Button title="Make Transaction" onPress={() => transaction()} disabled={balance <= 0}/>
          <Text>Total Balance : {balance.toFixed(2)}</Text>
        </View>
      ) : (
        <View style={{marginTop: '50%'}}>
          <Button title="Connect Wallet" onPress={() => connectWallet()} />
        </View>
      )}
    </>
  );
};

export default withWalletConnect(App, {
  clientMeta: {
    name: 'DD',
    url: 'https://DD.com',
    description: 'Testing',
  },
  redirectUrl:
    Platform.OS === 'web' ? window.location.origin : 'trust-rn-example://',
  storageOptions: {
    asyncStorage: AsyncStorage,
  },
});
