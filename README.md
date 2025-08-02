# ✪ OG | JAINE TESTNET MULTI BOT ✪

Automated multi-wallet swap bot for **Jaine Testnet (0G)**. Each wallet swaps across token pairs (USDT, ETH, BTC) in both directions.

---

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zamallrock/og-jaine-multiswap.git
   cd og-jaine-multiswap
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the bot:
   ```bash
   node og-jaine-multi.js
   ```
---

## 📁 Files

| File               | Description                        |
|--------------------|------------------------------------|
| `og-jaine-multi.js`| Main swap bot                      |
| `config.json`      | RPC and token/router addresses     |
| `privatekey.txt`   | List of wallets (with or without name) |
| `package.json`     | Dependencies and start script      |

---

## 🔑 Wallet Format

Each line in `privatekey.txt`:
```
name1|0xPRIVATEKEY1
name2|0xPRIVATEKEY2
```
Or just:
```
0xPRIVATEKEY1
0xPRIVATEKEY2
```

---


## 🔁 Swap Behavior

Each wallet will perform:

```
USDT → ETH
ETH  → USDT
USDT → BTC
BTC  → USDT
```
---

## 🧪 Testnet Only

- Use test wallets only
- Private keys are stored locally
- No external requests or tracking

---

## 🛠 Example Output

```
✪ ZAMALLROCK | JAINE TESTNET AUTO BOT ✪

[12:34:56] ▶️ Swap #1: Wallet zamallrock will swap USDT → ETH (Amount: 0.0021)
[12:35:16] TX sent: https://chainscan-galileo.0g.ai/tx/...

[12:37:22] Balance: AOGI: 0.65 | USDT: 1243.22 | ETH: 0.223 | BTC: 0.0021
[12:37:22] Waiting 183 seconds before next wallet...
```

---

## 👑 Author

**ZAMALLROCK**  
Made with ❤️ using Ethers.js  
[chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai)
