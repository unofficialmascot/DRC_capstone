export default function ScholarFeeDetails() {
  return (
    <div className="fee-container">
      <div className="fee-title">Fee Details</div>
      <div className="info-card">
        <table className="info-table">
          <thead>
            <tr>
              <th>Academic Year</th>
              <th>Semester</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-2025</td>
              <td>Odd</td>
              <td>₹75,000</td>
              <td>Aug 31, 2024</td>
              <td>
                <span className="pill">Paid</span>
              </td>
            </tr>
            <tr>
              <td>2024-2025</td>
              <td>Even</td>
              <td>₹75,000</td>
              <td>Jan 31, 2025</td>
              <td>
                <span className="pill warning">Due</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
