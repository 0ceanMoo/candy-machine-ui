import * as anchor from '@project-serum/anchor';
import { MintCountdown } from './MintCountdown';
import { toDate, formatNumber } from './utils';
import { MintButton } from './MintButton';
import { GatewayProvider } from '@civic/solana-gateway-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { sendTransaction } from './connection';
import {
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
} from './candy-machine';

export function Remaining({itemsRemaining}: {itemsRemaining: any}) {
  return (
    <>
      <dt>Remaining</dt>
      <dd>{itemsRemaining}</dd>
    </>
  )
}

export function Price({isWhitelistUser, discountPrice, candyMachine}: {isWhitelistUser: any, discountPrice: any, candyMachine: any}) {
  return (
    <>
      <dt>{isWhitelistUser && discountPrice ? 'Discount Price' : 'Price'}</dt>
      <dd>{isWhitelistUser && discountPrice ? formatNumber.asNumber(discountPrice) : formatNumber.asNumber(candyMachine.state.price,)}</dd>
    </>
  )
}

export function Status({isActive, endDate, candyMachine, toggleMintButton, isPresale}: {isActive: any, endDate: any, candyMachine: any, toggleMintButton: any, isPresale: any}) {
  return (
    <>
      {isActive && endDate && Date.now() < endDate.getTime() ? (
        <>
          <dt>Status</dt>
          <MintCountdown
            key="endSettings"
            date={getCountdownDate(candyMachine)}
            style={{ justifyContent: 'flex-end' }}
            status="COMPLETED"
            onComplete={toggleMintButton}
          />
          <dd>TO END OF MINT</dd>
        </>
      ) : (
        <>
          <dt>Status</dt>
          <MintCountdown
            key="goLive"
            date={getCountdownDate(candyMachine)}
            style={{ justifyContent: 'flex-end' }}
            status={
              candyMachine?.state?.isSoldOut || (endDate && Date.now() > endDate.getTime()) ? 'COMPLETED' : isPresale ? 'PRESALE' : 'LIVE'
            }
            onComplete={toggleMintButton}
          />
          {
            isPresale
            && candyMachine.state.goLiveDate
            && candyMachine.state.goLiveDate.toNumber() > new Date().getTime() / 1000
            && (<dd> UNTIL PUBLIC MINT</dd>)
          }
      </>
      )}
    </>
  )
}

export function MintContainer(
  {connection, candyMachine, wallet, setIsUserMinting, setAlertState, isUserMinting, onMint, isActive, rpcUrl, isPresale, isWhitelistUser}:
  {connection: any, candyMachine: any, wallet: any, setIsUserMinting: any, setAlertState: any, isUserMinting: any, onMint: any, isActive: any, rpcUrl: any, isPresale: any, isWhitelistUser: any}
) {
  return (
    <>
      {candyMachine?.state.isActive &&
      candyMachine?.state.gatekeeper &&
      wallet.publicKey &&
      wallet.signTransaction ? (
        <GatewayProvider
          wallet={{
            publicKey:
              wallet.publicKey ||
              new PublicKey(CANDY_MACHINE_PROGRAM),
            //@ts-ignore
            signTransaction: wallet.signTransaction,
          }}
          gatekeeperNetwork={
            candyMachine?.state?.gatekeeper?.gatekeeperNetwork
          }
          clusterUrl={rpcUrl}
          handleTransaction={async (transaction: Transaction) => {
            setIsUserMinting(true);
            const userMustSign = transaction.signatures.find(sig =>
              sig.publicKey.equals(wallet.publicKey!),
            );
            if (userMustSign) {
              setAlertState({open: true,message: 'Please sign one-time Civic Pass issuance',severity: 'info',});
              try {
                transaction = await wallet.signTransaction!(
                  transaction,
                );
              } catch (e) {
                setAlertState({open: true,message: 'User cancelled signing',severity: 'error',});
                // setTimeout(() => window.location.reload(), 2000);
                setIsUserMinting(false);
                throw e;
              }
            } else {
              setAlertState({open: true,message: 'Refreshing Civic Pass',severity: 'info',});
            }
            try {
              await sendTransaction(
                //props.connection,
                connection,
                wallet,
                transaction,
                [],
                true,
                'confirmed',
              );
              setAlertState({open: true,message: 'Please sign minting',severity: 'info',});
            } catch (e) {
              setAlertState({open: true,message:'Solana dropped the transaction, please try again',severity: 'warning',});
              console.error(e);
              // setTimeout(() => window.location.reload(), 2000);
              setIsUserMinting(false);
              throw e;
            }
            await onMint();
          }}
          broadcastTransaction={false}
          options={{ autoShowModal: false }}
        >
          <MintButton
            candyMachine={candyMachine}
            isMinting={isUserMinting}
            setIsMinting={val => setIsUserMinting(val)}
            onMint={onMint}
            isActive={isActive || (isPresale && isWhitelistUser)}
            rpcUrl={rpcUrl}
          />
        </GatewayProvider>
      ) : (
        <MintButton
          candyMachine={candyMachine}
          isMinting={isUserMinting}
          setIsMinting={val => setIsUserMinting(val)}
          onMint={onMint}
          isActive={isActive || (isPresale && isWhitelistUser)}
          rpcUrl={rpcUrl}
        />
      )}
    </>
  )
}

const getCountdownDate = (
  candyMachine: CandyMachineAccount,
): Date | undefined => {
  if (
    candyMachine.state.isActive &&
    candyMachine.state.endSettings?.endSettingType.date
  ) {
    return toDate(candyMachine.state.endSettings.number);
  }

  return toDate(
    candyMachine.state.goLiveDate
      ? candyMachine.state.goLiveDate
      : candyMachine.state.isPresale
      ? new anchor.BN(new Date().getTime() / 1000)
      : undefined,
  );
};
