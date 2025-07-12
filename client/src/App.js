import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // For interacting with Ethereum
// Assuming contract ABI and address will be available after deployment
// import contractABI from './contractABI.json';
// import contractAddress from './contractAddress.json';

// Placeholder for contract details (replace with actual deployed values)
const CONTRACT_ADDRESS = '0xYourDeployedContractAddressHere'; // Replace with actual deployed address
const CONTRACT_ABI = [
    // Simplified ABI for demonstration. In a real app, you'd import the full ABI.
    "function executePolicy(bytes32 _policyMerkleRoot) returns (uint256)",
    "function recordExpenditure(uint256 _policyId, address _recipient, uint256 _amount, string calldata _description)",
    "function recordSelfDiagnosticLog(uint256 _policyId, string calldata _message)",
    "function getPolicyMerkleRoot(uint256 _policyId) view returns (bytes32)",
    "function getPolicyInitiator(uint256 _policyId) view returns (address)",
    "function getPolicyTimestamp(uint256 _policyId) view returns (uint256)",
    "function getSelfDiagnosticLog(uint256 _policyId, uint256 _logIndex) view returns (string memory)",
    "function getTotalPolicies() view returns (uint256)",
    "event PolicyExecuted(uint256 indexed policyId, bytes32 merkelRoot, address indexed initiator, uint256 timestamp)",
    "event ExpenditureRecorded(uint256 indexed policyId, address indexed recipient, uint256 amount, string description)",
    "event SelfDiagnosticLog(uint256 indexed policyId, uint256 logIndex, string message)"
];

function App() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState('');
    const [message, setMessage] = useState('');
    const [policyMerkleRoot, setPolicyMerkleRoot] = useState('');
    const [policyIdForExpenditure, setPolicyIdForExpenditure] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [expenditureDescription, setExpenditureDescription] = useState('');
    const [policyIdForLog, setPolicyIdForLog] = useState('');
    const [logMessage, setLogMessage] = useState('');
    const [totalPolicies, setTotalPolicies] = useState(0);
    const [fetchedPolicy, setFetchedPolicy] = useState(null);
    const [fetchedLog, setFetchedLog] = useState(null);
    const [fetchPolicyId, setFetchPolicyId] = useState('');
    const [fetchLogPolicyId, setFetchLogPolicyId] = useState('');
    const [fetchLogIndex, setFetchLogIndex] = useState('');


    useEffect(() => {
        // Initialize Web3 provider and signer
        const initWeb3 = async () => {
            if (window.ethereum) {
                try {
                    const web3Provider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(web3Provider);

                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    setAccount(accounts[0]);

                    const web3Signer = await web3Provider.getSigner();
                    setSigner(web3Signer);

                    const deployedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer);
                    setContract(deployedContract);

                    setMessage('Connected to MetaMask!');
                    fetchTotalPolicies(deployedContract);

                    // Listen for account changes
                    window.ethereum.on('accountsChanged', (newAccounts) => {
                        if (newAccounts.length > 0) {
                            setAccount(newAccounts[0]);
                            setMessage(`Account changed to: ${newAccounts[0]}`);
                        } else {
                            setAccount('');
                            setMessage('Disconnected from MetaMask.');
                        }
                    });

                    // Listen for chain changes
                    window.ethereum.on('chainChanged', (chainId) => {
                        setMessage(`Network changed to chain ID: ${chainId}. Please refresh.`);
                        window.location.reload(); // Reload to re-initialize provider/signer
                    });

                } catch (error) {
                    console.error("Error connecting to MetaMask:", error);
                    setMessage("Failed to connect to MetaMask. Please ensure it's installed and unlocked.");
                }
            } else {
                setMessage("MetaMask is not installed. Please install it to use this dApp.");
            }
        };

        initWeb3();
    }, []);

    // Function to fetch total policies
    const fetchTotalPolicies = async (contractInstance) => {
        if (contractInstance) {
            try {
                const total = await contractInstance.getTotalPolicies();
                setTotalPolicies(Number(total)); // Convert BigInt to Number
            } catch (error) {
                console.error("Error fetching total policies:", error);
                setMessage("Error fetching total policies.");
            }
        }
    };

    // Function to execute a policy
    const handleExecutePolicy = async () => {
        if (!contract || !policyMerkleRoot) {
            setMessage("Please connect to MetaMask and provide a Merkle Root.");
            return;
        }

        setMessage("Executing policy...");
        try {
            // In a real scenario, the LLM Oracle would call this function.
            // For testing, we're simulating by having the connected account call it.
            // Ensure the connected account's address matches the constitutionalLLMOracle address
            // set during contract deployment for the `onlyConstitutionalLLMVerified` modifier to pass.
            const tx = await contract.executePolicy(ethers.keccak256(ethers.toUtf8Bytes(policyMerkleRoot)));
            await tx.wait();
            setMessage(`Policy executed! Transaction hash: ${tx.hash}. Policy ID: ${totalPolicies}`);
            fetchTotalPolicies(contract); // Refresh total policies
            setPolicyMerkleRoot(''); // Clear input
        } catch (error) {
            console.error("Error executing policy:", error);
            setMessage(`Error executing policy: ${error.message}`);
        }
    };

    // Function to record an expenditure
    const handleRecordExpenditure = async () => {
        if (!contract || !policyIdForExpenditure || !recipientAddress || !amount || !expenditureDescription) {
            setMessage("Please fill all expenditure fields.");
            return;
        }

        setMessage("Recording expenditure...");
        try {
            const tx = await contract.recordExpenditure(
                Number(policyIdForExpenditure), // Ensure it's a number
                recipientAddress,
                ethers.parseEther(amount), // Convert ETH to Wei
                expenditureDescription
            );
            await tx.wait();
            setMessage(`Expenditure recorded! Transaction hash: ${tx.hash}`);
            setPolicyIdForExpenditure('');
            setRecipientAddress('');
            setAmount('');
            setExpenditureDescription('');
        } catch (error) {
            console.error("Error recording expenditure:", error);
            setMessage(`Error recording expenditure: ${error.message}`);
        }
    };

    // Function to record a self-diagnostic log
    const handleRecordLog = async () => {
        if (!contract || !policyIdForLog || !logMessage) {
            setMessage("Please fill all log fields.");
            return;
        }

        setMessage("Recording self-diagnostic log...");
        try {
            const tx = await contract.recordSelfDiagnosticLog(Number(policyIdForLog), logMessage);
            await tx.wait();
            setMessage(`Self-diagnostic log recorded! Transaction hash: ${tx.hash}`);
            setPolicyIdForLog('');
            setLogMessage('');
        } catch (error) {
            console.error("Error recording log:", error);
            setMessage(`Error recording log: ${error.message}`);
        }
    };

    // Function to fetch policy details
    const handleFetchPolicy = async () => {
        if (!contract || fetchPolicyId === '') {
            setMessage("Please enter a Policy ID to fetch.");
            return;
        }
        setMessage("Fetching policy details...");
        try {
            const merkelRoot = await contract.getPolicyMerkleRoot(Number(fetchPolicyId));
            const initiator = await contract.getPolicyInitiator(Number(fetchPolicyId));
            const timestamp = await contract.getPolicyTimestamp(Number(fetchPolicyId));
            setFetchedPolicy({
                id: fetchPolicyId,
                merkelRoot: merkelRoot,
                initiator: initiator,
                timestamp: new Date(Number(timestamp) * 1000).toLocaleString() // Convert Unix timestamp to readable date
            });
            setMessage(`Policy ${fetchPolicyId} fetched successfully.`);
        } catch (error) {
            console.error("Error fetching policy:", error);
            setMessage(`Error fetching policy: ${error.message}`);
            setFetchedPolicy(null);
        }
    };

    // Function to fetch self-diagnostic log
    const handleFetchLog = async () => {
        if (!contract || fetchLogPolicyId === '' || fetchLogIndex === '') {
            setMessage("Please enter Policy ID and Log Index to fetch.");
            return;
        }
        setMessage("Fetching log details...");
        try {
            const log = await contract.getSelfDiagnosticLog(Number(fetchLogPolicyId), Number(fetchLogIndex));
            setFetchedLog({
                policyId: fetchLogPolicyId,
                logIndex: fetchLogIndex,
                message: log
            });
            setMessage(`Log for Policy ${fetchLogPolicyId}, Index ${fetchLogIndex} fetched successfully.`);
        } catch (error) {
            console.error("Error fetching log:", error);
            setMessage(`Error fetching log: ${error.message}`);
            setFetchedLog(null);
        }
    };

    return (
        <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg max-w-4xl">
            <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">AI Republic Executive Engine</h1>
            <p className="text-center text-gray-600 mb-4">
                Connected Account: <span className="font-semibold text-blue-500">{account || 'Not connected'}</span>
            </p>
            {message && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Execute Policy Section */}
                <div className="bg-gray-50 p-5 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-blue-600 mb-4">Execute New Policy</h2>
                    <p className="text-sm text-gray-500 mb-3">
                        Total Policies Recorded: <span className="font-bold">{totalPolicies}</span>
                    </p>
                    <div className="mb-4">
                        <label htmlFor="policyMerkleRoot" className="block text-gray-700 text-sm font-bold mb-2">
                            Policy Merkle Root (Hash):
                        </label>
                        <input
                            type="text"
                            id="policyMerkleRoot"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0xabcdef1234567890..."
                            value={policyMerkleRoot}
                            onChange={(e) => setPolicyMerkleRoot(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExecutePolicy}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out transform hover:scale-105"
                        disabled={!contract || !account}
                    >
                        Execute Policy
                    </button>
                </div>

                {/* Record Expenditure Section */}
                <div className="bg-gray-50 p-5 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-blue-600 mb-4">Record Expenditure</h2>
                    <div className="mb-4">
                        <label htmlFor="policyIdForExpenditure" className="block text-gray-700 text-sm font-bold mb-2">
                            Policy ID:
                        </label>
                        <input
                            type="number"
                            id="policyIdForExpenditure"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0"
                            value={policyIdForExpenditure}
                            onChange={(e) => setPolicyIdForExpenditure(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="recipientAddress" className="block text-gray-700 text-sm font-bold mb-2">
                            Recipient Address:
                        </label>
                        <input
                            type="text"
                            id="recipientAddress"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0x..."
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
                            Amount (ETH):
                        </label>
                        <input
                            type="text"
                            id="amount"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0.5"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="expenditureDescription" className="block text-gray-700 text-sm font-bold mb-2">
                            Description:
                        </label>
                        <input
                            type="text"
                            id="expenditureDescription"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., Office supplies"
                            value={expenditureDescription}
                            onChange={(e) => setExpenditureDescription(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleRecordExpenditure}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out transform hover:scale-105"
                        disabled={!contract || !account}
                    >
                        Record Expenditure
                    </button>
                </div>

                {/* Record Self-Diagnostic Log Section */}
                <div className="bg-gray-50 p-5 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-blue-600 mb-4">Record Self-Diagnostic Log</h2>
                    <div className="mb-4">
                        <label htmlFor="policyIdForLog" className="block text-gray-700 text-sm font-bold mb-2">
                            Policy ID:
                        </label>
                        <input
                            type="number"
                            id="policyIdForLog"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0"
                            value={policyIdForLog}
                            onChange={(e) => setPolicyIdForLog(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="logMessage" className="block text-gray-700 text-sm font-bold mb-2">
                            Log Message:
                        </label>
                        <textarea
                            id="logMessage"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., Execution failed due to invalid parameter."
                            rows="3"
                            value={logMessage}
                            onChange={(e) => setLogMessage(e.target.value)}
                        ></textarea>
                    </div>
                    <button
                        onClick={handleRecordLog}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out transform hover:scale-105"
                        disabled={!contract || !account}
                    >
                        Record Log
                    </button>
                </div>

                {/* Fetch Policy Details Section */}
                <div className="bg-gray-50 p-5 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-blue-600 mb-4">Fetch Policy Details</h2>
                    <div className="mb-4">
                        <label htmlFor="fetchPolicyId" className="block text-gray-700 text-sm font-bold mb-2">
                            Policy ID:
                        </label>
                        <input
                            type="number"
                            id="fetchPolicyId"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0"
                            value={fetchPolicyId}
                            onChange={(e) => setFetchPolicyId(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleFetchPolicy}
                        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out transform hover:scale-105"
                        disabled={!contract}
                    >
                        Fetch Policy
                    </button>
                    {fetchedPolicy && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-200 text-sm">
                            <p><strong>Policy ID:</strong> {fetchedPolicy.id}</p>
                            <p><strong>Merkle Root:</strong> {fetchedPolicy.merkelRoot}</p>
                            <p><strong>Initiator:</strong> {fetchedPolicy.initiator}</p>
                            <p><strong>Timestamp:</strong> {fetchedPolicy.timestamp}</p>
                        </div>
                    )}
                </div>

                {/* Fetch Self-Diagnostic Log Section */}
                <div className="bg-gray-50 p-5 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-blue-600 mb-4">Fetch Self-Diagnostic Log</h2>
                    <div className="mb-4">
                        <label htmlFor="fetchLogPolicyId" className="block text-gray-700 text-sm font-bold mb-2">
                            Policy ID:
                        </label>
                        <input
                            type="number"
                            id="fetchLogPolicyId"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0"
                            value={fetchLogPolicyId}
                            onChange={(e) => setFetchLogPolicyId(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="fetchLogIndex" className="block text-gray-700 text-sm font-bold mb-2">
                            Log Index:
                        </label>
                        <input
                            type="number"
                            id="fetchLogIndex"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="e.g., 0"
                            value={fetchLogIndex}
                            onChange={(e) => setFetchLogIndex(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleFetchLog}
                        className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out transform hover:scale-105"
                        disabled={!contract}
                    >
                        Fetch Log
                    </button>
                    {fetchedLog && (
                        <div className="mt-4 p-3 bg-indigo-50 rounded-md border border-indigo-200 text-sm">
                            <p><strong>Policy ID:</strong> {fetchedLog.policyId}</p>
                            <p><strong>Log Index:</strong> {fetchedLog.logIndex}</p>
                            <p><strong>Message:</strong> {fetchedLog.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
