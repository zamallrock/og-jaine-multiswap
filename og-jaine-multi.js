import fs from "fs";
import { ethers } from "ethers";

console.log("\n✪ ZAMALLROCK | JAINE TESTNET AUTO BOT ✪\n");

const config = JSON.parse(fs.readFileSync("config.json"));
const wallets = fs.readFileSync("privatekey.txt", "utf8")
  .split("\n")
  .map((line, i) => {
    const [name, key] = line.includes("|") ? line.split("|") : [`Wallet #${i + 1}`, line];
    return { name: name.trim(), key: key.trim() };
  });

const EXPLORER = "https://chainscan-galileo.0g.ai";
const provider = new ethers.JsonRpcProvider(config.RPC_URL);

const CONTRACT_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ]
      }
    ],
    outputs: [{ name: "amountOut", type: "uint256" }]
  }
];

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "_spender", type: "address" }, { name: "_value", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "balanceOf", type: "function", inputs: [{ name: "_owner", type: "address" }], outputs: [{ name: "balance", type: "uint256" }], constant: true },
  { name: "allowance", type: "function", inputs: [{ name: "_owner", type: "address" }, { name: "_spender", type: "address" }], outputs: [{ name: "remaining", type: "uint256" }], constant: true }
];

function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function format(val) {
  return parseFloat(ethers.formatEther(val)).toFixed(4);
}

const tokenSymbols = {
  [config.USDT_ADDRESS]: "USDT",
  [config.ETH_ADDRESS]: "ETH",
  [config.BTC_ADDRESS]: "BTC"
};

const tokenSymbol = addr => tokenSymbols[addr] || addr.slice(0, 6);

async function approveIfNeeded(wallet, token, amount) {
  const contract = new ethers.Contract(token, ERC20_ABI, wallet);
  const allowance = await contract.allowance(wallet.address, config.ROUTER_ADDRESS);
  if (allowance < amount) {
    log(`🛂 Approving ${tokenSymbol(token)}...`);
    const tx = await contract.approve(config.ROUTER_ADDRESS, amount);
    await tx.wait();
    log(`✅ Approve: ${token.slice(0, 6)}... OK`);
  } else {
    log(`✔️  Allowance cukup untuk ${tokenSymbol(token)} (skip approve)`);
  }
}

async function safeBalance(token, wallet) {
  try {
    const contract = new ethers.Contract(token, ERC20_ABI, provider);
    const bal = await contract.balanceOf(wallet.address);
    return format(bal);
  } catch (err) {
    log(`⚠️ Gagal ambil saldo token ${token.slice(0, 6)}: ${err.code || err.message}`);
    return '0.0000';
  }
}

async function printBalance(wallet) {
  try {
    const aogi = await provider.getBalance(wallet.address);
    const usdt = await safeBalance(config.USDT_ADDRESS, wallet);
    const eth  = await safeBalance(config.ETH_ADDRESS, wallet);
    const btc  = await safeBalance(config.BTC_ADDRESS, wallet);
    log(`Saldo: AOGI: ${format(aogi)} | USDT: ${usdt} | ETH: ${eth} | BTC: ${btc}`);
  } catch (e) {
    log(`⚠️ Gagal print saldo: ${e.message}`);
  }
}

async function swap(wallet, from, to, amount) {
  const router = new ethers.Contract(config.ROUTER_ADDRESS, CONTRACT_ABI, wallet);

  log(`⏳ [${tokenSymbol(from)}] Checking allowance...`);
  await approveIfNeeded(wallet, from, amount);

  log(`🚀 Sending swap TX ${tokenSymbol(from)} → ${tokenSymbol(to)} (Amount: ${format(amount)})...`);
  const deadline = Math.floor(Date.now() / 1000) + 300;
  const params = {
    tokenIn: from,
    tokenOut: to,
    fee: 3000,
    recipient: wallet.address,
    deadline,
    amountIn: amount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0n
  };

  const gasPrice = (await provider.getFeeData()).gasPrice * (Math.random() > 0.5 ? 2n : 1n);
  const tx = await router.exactInputSingle(params, { gasLimit: 200000, gasPrice });

  log(`📤 TX sent: ${tx.hash}`);

  // ✅ Timeout: 60 detik
  try {
    await Promise.race([
      tx.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TX timeout")), 60000)
      )
    ]);
    log(`✅ ${tokenSymbol(from)} → ${tokenSymbol(to)}: ${format(amount)} - TX confirmed: ${EXPLORER}/tx/${tx.hash}`);
  } catch (err) {
    throw new Error(`TX Failed or Timeout (${tokenSymbol(from)} → ${tokenSymbol(to)}): ${err.message}`);
  }
}

const pairs = [
  [config.USDT_ADDRESS, config.ETH_ADDRESS],
  [config.USDT_ADDRESS, config.BTC_ADDRESS]
];

async function startBot() {
  let walletIndex = 0;
  let swapCount = 1;

  const swapPairs = [];
  for (const [from, to] of pairs) {
    swapPairs.push([from, to]);
    swapPairs.push([to, from]);
  }

  while (true) {
    const { name, key } = wallets[walletIndex];
    const signer = new ethers.Wallet(key, provider);
    log(`Wallet: ${name} (${signer.address})`);

    for (const [from, to] of swapPairs) {
      await delay(300);
      const raw = (Math.random() * 0.002 + 0.001).toFixed(6);
      const amount = ethers.parseUnits(raw, 18);

      const tokenContract = new ethers.Contract(from, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(signer.address);
      if (balance < amount) {
        log(`⏭️ Skip: Saldo ${tokenSymbol(from)} kurang dari ${raw}`);
        continue;
      }

      log(`▶️ Swap #${swapCount}: Wallet ${name} akan swap ${tokenSymbol(from)} → ${tokenSymbol(to)} (Amount: ${raw})`);

      let success = false;
      for (let i = 0; i < 3; i++) {
        try {
          await swap(signer, from, to, amount);
          success = true;
          break;
        } catch (e) {
          if (e.message.includes("rate exceeded")) {
            const wait = 500 * (i + 1);
            log(`⚠️ RPC rate limited — retry ${i + 1} after ${wait}ms`);
            await delay(wait);
          } else {
            log("Swap GAGAL: " + e.message);
            break;
          }
        }
      }

      if (!success) log("❌ Semua retry swap gagal.");

      log(`⏳ Delay 20 detik sebelum pair berikutnya...`);
      await delay(20000);
      swapCount++;
    }

    await printBalance(signer);
    const waitSec = Math.floor(Math.random() * (300 - 60 + 1)) + 60;
    log(`🕒 Menunggu ${waitSec} detik sebelum wallet berikutnya...`);
    await delay(waitSec * 1000);
    log(`🔄 Lanjut ke wallet berikutnya...\n`);

    walletIndex = (walletIndex + 1) % wallets.length;
  }
}

startBot();
