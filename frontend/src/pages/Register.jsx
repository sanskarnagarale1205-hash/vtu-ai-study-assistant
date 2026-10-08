    import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    branch: "CSE",
    semester: 4,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post(
        "/auth/register",
        formData
      );

      if (response.data.success) {
        alert("Registration successful!");

        navigate("/");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div>
      <h1>AI Study Assistant</h1>

      <h2>Create Account</h2>

      <form onSubmit={handleRegister}>

        <input
          type="text"
          name="name"
          placeholder="Enter Name"
          value={formData.name}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          value={formData.email}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Enter Password"
          value={formData.password}
          onChange={handleChange}
        />

        <br /><br />

        <select
          name="branch"
          value={formData.branch}
          onChange={handleChange}
        >
          <option value="CSE">CSE</option>
          <option value="ISE">ISE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="ME">ME</option>
          <option value="CV">CV</option>
        </select>

        <br /><br />

        <input
          type="number"
          name="semester"
          min="1"
          max="8"
          value={formData.semester}
          onChange={handleChange}
        />

        <br /><br />

        <button type="submit">
          Register
        </button>

      </form>

      <br />

      <button onClick={() => navigate("/")}>
        Already have an account? Login
      </button>
    </div>
  );
}

export default Register;