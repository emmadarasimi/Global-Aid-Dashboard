# 🌍 Global Aid Dashboard

This project leverages the Stacks blockchain and Clarity smart contracts to create a transparent, decentralized platform for tracking and aggregating the impact of donations across various global causes. It addresses the real-world problem of donor trust and transparency in charitable giving by providing a verifiable, tamper-proof record of donation flows and their measurable impacts.

## ✨ Features

- 📊 Aggregate donation data across multiple causes (e.g., education, healthcare, disaster relief).
- 💸 Enable secure, transparent donations using STX (Stacks' native token).
- 📈 Track and display real-time impact metrics (e.g., number of people helped, funds allocated).
- 🔒 Ensure donor anonymity while maintaining public transparency of fund usage.
- ✅ Verify donation authenticity and prevent double-spending or fraud.
- 🌐 Allow organizations to register and manage their campaigns.
- 🔔 Notify donors of impact updates for their contributions.
- 🔍 Provide a public dashboard for exploring donation impact globally.

## 🛠 How It Works

**For Donors**
- Register a donation by specifying the cause and amount in STX.
- Receive a unique donation ID and impact tracking updates.
- Verify donation allocation on the public dashboard.

**For Organizations**
- Register a cause with a description, target funding, and impact metrics.
- Update impact metrics as funds are utilized (e.g., "100 students educated").
- Withdraw allocated funds after verification.

**For the Public**
- Explore the dashboard to see aggregated donation data and impact metrics.
- Verify the authenticity of donations and their usage via the blockchain.


## 📋 Project Structure

1. **donation-core.clar**: Manages donation registration, tracks amounts, and links donations to causes.
2. **user-management.clar**: Handles donor and organization registration, ensuring only verified entities participate.
3. **impact-tracker.clar**: Allows organizations to update measurable impact metrics (e.g., "50 meals provided").
4. **withdrawal.clar**: Enables organizations to withdraw funds after meeting verification criteria.
5. **verification.clar**: Provides functions for public verification of donations and fund usage.
6. **cause-registry.clar**: Manages cause creation and validation by organizations.
7. **notification-system.clar**: Sends impact update notifications to donors.

## 🚀 Getting Started

1. **Deploy Contracts**: Deploy the Clarity smart contracts on the Stacks blockchain.
2. **Integrate Frontend**: Build a web-based dashboard using JavaScript and the Stacks.js library to interact with the contracts.
3. **Register Causes**: Organizations can register causes with clear descriptions and target funding amounts.
4. **Donate**: Donors send STX to the contract, specifying the cause ID.
5. **Track Impact**: Organizations update impact metrics, which are reflected on the public dashboard.
6. **Verify**: Anyone can query the blockchain to verify donation authenticity and impact.

## 🛠 Tech Stack

- **Blockchain**: Stacks (for secure, Bitcoin-anchored transactions).
- **Smart Contracts**: Clarity (for transparent, predictable logic).
- **Frontend**: HTML/CSS/JavaScript with Stacks.js for wallet integration.
- **Backend**: Optional Node.js server for off-chain aggregation and API support.
- **Dashboard**: React or Vue.js for dynamic data visualization.

## 🌟 Why This Matters

The Global Aid Dashboard tackles the lack of transparency in charitable giving by:
- Ensuring donations are traceable and verifiable.
- Providing real-time impact metrics to build donor trust.
- Reducing fraud through immutable blockchain records.
- Empowering organizations to showcase their impact globally.

## 📜 License

MIT License - feel free to fork and build upon this project!