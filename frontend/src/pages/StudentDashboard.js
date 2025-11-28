import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './Dashboard.css';

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, resellersRes] = await Promise.all([
        axios.get('/courses'),
        axios.get('/public/resellers')
      ]);
      
      setCourses(coursesRes.data.data.courses);
      setResellers(resellersRes.data.data);
      
      if (resellersRes.data.data.length === 0) {
        setError('No active resellers available. Please contact admin.');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (course, resellerId) => {
    try {
      // Create order
      const orderRes = await axios.post('/enrollment/create-order', {
        courseId: course._id,
        resellerId: resellerId
      });

      const { orderId, amount, currency, keyId } = orderRes.data.data;

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Course Reseller Platform',
        description: course.title,
        order_id: orderId,
        handler: function (response) {
          alert('Payment Successful! Course activated.');
          window.location.reload();
        },
        prefill: {
          name: userName,
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#528FF0'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed');
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
          <h1>Student Dashboard</h1>
          <div className="navbar-right">
            <div className="user-info">
              <span>Welcome, {userName}</span>
              <span className="user-badge">STUDENT</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        {error && <div className="error">{error}</div>}

        <h2>Available Courses</h2>
        
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course._id} className="course-card">
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-details">
                <span className="course-price">₹{course.price}</span>
                <span className="course-category">{course.category}</span>
              </div>
              
              <div className="reseller-select">
                <label>Select Reseller:</label>
                <select id={`reseller-${course._id}`}>
                  {resellers.map(reseller => (
                    <option key={reseller._id} value={reseller._id}>
                      {reseller.name}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                className="btn btn-primary btn-block"
                onClick={() => {
                  const select = document.getElementById(`reseller-${course._id}`);
                  handlePayment(course, select.value);
                }}
              >
                Pay ₹{course.price}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
