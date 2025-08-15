// pages/social-entry.js

import React, { useState } from "react";

export default function SocialEntry() {
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    idNumber: "",
    howHeard: "",
    photo: null,
    isMember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Payment process coming soon. You will receive a confirmation email & your QR code.");
  };

  return (
    <div className="page-container">
      <h1>Social After Dark Entry</h1>
      <p>
        **Open Friday & Saturday nights, 11 PM – 3 AM**  
        Join us for an exclusive, members-only vibe.  
        Entry Fee: <strong>$20 for Non-Members</strong>, <strong>$10 for Members</strong>.  
        Must be 21+ to attend.
      </p>

      <h2>Registration Form</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <label>
          Full Name (must match state ID):
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
        </label>

        <label>
          Date of Birth:
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
        </label>

        <label>
          State ID / Driver’s License Number:
          <input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required />
        </label>

        <label>
          How did you hear about us?
          <input type="text" name="howHeard" value={formData.howHeard} onChange={handleChange} required />
        </label>

        <label>
          Upload Photo (required):
          <input type="file" name="photo" accept="image/*" onChange={handleChange} required />
        </label>

        <label>
          Are you a current member?
          <input type="checkbox" name="isMember" checked={formData.isMember} onChange={handleChange} />
        </label>

        <button type="submit" className="pay-btn">Pay Now</button>
      </form>

      <h2>Rules & Policies</h2>
      <ul>
        <li>Must be 21+ to attend; ID will be checked upon arrival.</li>
        <li>No outside food or drinks permitted.</li>
        <li>Maximum of 4 guests per party.</li>
        <li>All weapons must remain secured in your vehicle.</li>
        <li>Zero tolerance for violence, assault, theft, property damage — violations result in immediate ban.</li>
        <li>Security will be tight for everyone’s safety.</li>
        <li>Once payment is received, you will be emailed & texted the event address and codeword.</li>
        <li>You will also receive a QR code — have it ready to scan at entry.</li>
      </ul>

      <style jsx>{`
        .page-container {
          padding: 20px;
          background-color: #0a1110;
          color: #d8c07a;
          font-family: 'Arial', sans-serif;
        }
        h1, h2 {
          color: #d8c07a;
        }
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          background: #0e1915;
          padding: 20px;
          border-radius: 10px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: bold;
        }
        input, select {
          padding: 8px;
          border: none;
          border-radius: 5px;
          margin-top: 5px;
        }
        .pay-btn {
          background-color: #d8c07a;
          color: #0a1110;
          padding: 12px;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .pay-btn:hover {
          background-color: #bfa76f;
        }
        ul {
          background: #0e1915;
          padding: 15px;
          border-radius: 10px;
          list-style: disc;
        }
      `}</style>
    </div>
  );
}
