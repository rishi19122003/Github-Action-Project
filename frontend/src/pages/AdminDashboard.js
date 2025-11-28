import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './Dashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, commissionsRes] = await Promise.all([
        axios.get('/admin/commissions/stats'),
        axios.get('/admin/commissions/pending')
      ]);

      setStats(statsRes.data.data);
      setPendingCommissions(commissionsRes.data.data.commissions);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    
    if (!payoutAmount || payoutAmount < 100) {
      alert('Minimum payout amount is ₹100');
      return;
    }

    try {
      const response = await axios.post('/payout/create', {
        amount: parseInt(payoutAmount),
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          accountHolderName: 'Admin User',
          bankName: 'State Bank of India'
        },
        mode: 'IMPS'
      });

      alert('Payout initiated successfully! (Simulated in TEST mode)');
      setShowPayoutForm(false);
      setPayoutAmount('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Payout failed');
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
          <h1>Admin Dashboard</h1>
          <div className="navbar-right">
            <div className="user-info">
              <span>Welcome, {userName}</span>
              <span className="user-badge">ADMIN</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Total Commission Collected</h3>
              <p className="stat-number">₹{stats?.totalCommissionPaid || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Commissions</h3>
              <p className="stat-number text-warning">₹{stats?.totalCommissionPending || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Total Enrollments</h3>
              <p className="stat-number">{stats?.totalEnrollments || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Resellers</h3>
              <p className="stat-number">{stats?.totalResellers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🚫</div>
            <div className="stat-content">
              <h3>Blocked Resellers</h3>
              <p className="stat-number text-danger">{stats?.blockedResellers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <h3>Available for Withdrawal</h3>
              <p className="stat-number text-success">₹{stats?.adminWalletBalance || 0}</p>
            </div>
          </div>
        </div>

        {/* Payout Section */}
        <div className="card">
          <div className="card-header">
            <h3>💸 Withdraw Commission</h3>
            <button 
              className="btn btn-success"
              onClick={() => setShowPayoutForm(!showPayoutForm)}
            >
              {showPayoutForm ? 'Cancel' : 'Withdraw Money'}
            </button>
          </div>

          {showPayoutForm && (
            <form onSubmit={handlePayout} className="payout-form">
              <div className="form-group">
                <label>Amount to Withdraw (Min: ₹100)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="100"
                  required
                />
              </div>
              <div className="form-info">
                <p>💡 Available Balance: ₹{stats?.adminWalletBalance || 0}</p>
                <p>🏦 Money will be transferred to your registered bank account</p>
                <p>⚡ In TEST mode, payout is simulated</p>
              </div>
              <button type="submit" className="btn btn-primary">
                Initiate Payout
              </button>
            </form>
          )}
        </div>

        {/* Pending Commissions */}
        <div className="card">
          <h3>⏳ Pending Commissions</h3>
          {pendingCommissions.length === 0 ? (
            <p className="text-center">No pending commissions</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reseller</th>
                    <th>Course</th>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCommissions.map((commission) => (
                    <tr key={commission._id}>
                      <td>{commission.resellerId?.name}</td>
                      <td>{commission.enrollmentId?.courseId?.title}</td>
                      <td>{commission.enrollmentId?.studentId?.name}</td>
                      <td className="text-warning">₹{commission.amount}</td>
                      <td>{new Date(commission.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-warning">PENDING</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
