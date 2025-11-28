import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './Dashboard.css';

function ResellerDashboard() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching reseller data...');
      
      const [walletRes, transactionsRes, enrollmentsRes] = await Promise.all([
        axios.get('/wallet/balance'),
        axios.get('/wallet/transactions'),
        axios.get('/enrollment/reseller/enrollments')
      ]);

      console.log('Wallet data:', walletRes.data);
      console.log('Transactions data:', transactionsRes.data);
      console.log('Enrollments data:', enrollmentsRes.data);

      setWallet(walletRes.data.data);
      setTransactions(transactionsRes.data.data.transactions || []);
      setEnrollments(enrollmentsRes.data.data.enrollments || []);
    } catch (err) {
      console.error('Failed to load reseller data:', err);
      console.error('Error response:', err.response);
      // Don't block the page, just show empty data
      setWallet({ balance: 0, totalEarned: 0, totalCommissionPaid: 0, totalCommissionPending: 0, totalTopUp: 0 });
      setTransactions([]);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <h1>Reseller Dashboard</h1>
          <div className="navbar-right">
            <div className="user-info">
              <span>Welcome, {userName}</span>
              <span className="user-badge">RESELLER</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        {!wallet && (
          <div className="error">
            Wallet not found. Please contact admin to set up your wallet.
          </div>
        )}
        
        {/* Wallet Card */}
        <div className="wallet-card">
          <h2>💰 Wallet Balance</h2>
          <div className="wallet-balance">
            <span className="balance-amount">₹{wallet?.balance || 0}</span>
            {wallet?.isBlocked && (
              <span className="blocked-badge">⚠️ BLOCKED</span>
            )}
          </div>
          
          <div className="wallet-stats">
            <div className="stat-item">
              <span className="stat-label">Total Earned</span>
              <span className="stat-value">₹{wallet?.totalEarned || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Commission Paid</span>
              <span className="stat-value">₹{wallet?.totalCommissionPaid || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Commission Pending</span>
              <span className="stat-value text-danger">₹{wallet?.totalCommissionPending || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Top-Up</span>
              <span className="stat-value">₹{wallet?.totalTopUp || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3>Recent Transactions</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((txn, index) => (
                  <tr key={index}>
                    <td>
                      <span className={`badge ${txn.type === 'CREDIT' ? 'badge-success' : 'badge-danger'}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td>{txn.category}</td>
                    <td className={txn.type === 'CREDIT' ? 'text-success' : 'text-danger'}>
                      {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
                    </td>
                    <td>₹{txn.balanceAfter}</td>
                    <td>{txn.description}</td>
                    <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card">
          <h3>Recent Sales</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Student</th>
                  <th>Price</th>
                  <th>Commission</th>
                  <th>Your Earning</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.slice(0, 10).map((enrollment) => (
                  <tr key={enrollment._id}>
                    <td>{enrollment.courseId?.title}</td>
                    <td>{enrollment.studentId?.name}</td>
                    <td>₹{enrollment.coursePrice}</td>
                    <td className="text-danger">-₹{enrollment.adminCommission}</td>
                    <td className="text-success">₹{enrollment.resellerEarning}</td>
                    <td>
                      <span className={`badge ${enrollment.paymentStatus === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                        {enrollment.paymentStatus}
                      </span>
                    </td>
                    <td>{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResellerDashboard;
