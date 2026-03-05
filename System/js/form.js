// LOST & FOUND ITEM FORM HANDLER

document.getElementById('itemForm').addEventListener('submit', async (e) => {

  e.preventDefault(); // Prevent page reload

  


  // Collect Form Data


  const data = Object.fromEntries(new FormData(e.target));

  const feedback = document.getElementById('feedback');




  // CLIENT-SIDE VALIDATION



  // Required fields check
  if (!data.title || !data.description || !data.category ||
      !data.location || !data.date || !data.contact) {

    feedback.textContent = "All fields are required.";
    feedback.style.color = "#e53e3e";
    return;
  }

  // Category validation
  if (!['Lost', 'Found'].includes(data.category)) {
    feedback.textContent = "Invalid category selected.";
    feedback.style.color = "#e53e3e";
    return;
  }

  // Date validation (cannot be future date)
  const today = new Date().toISOString().split('T')[0];
  if (data.date > today) {
    feedback.textContent = "Date cannot be in the future.";
    feedback.style.color = "#e53e3e";
    return;
  }


  //Send Data to Backend (API)

  try {

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      feedback.textContent = result.message;
      feedback.style.color = "#38a169"; // green success
      e.target.reset(); // Clear form after success
    } else {
      feedback.textContent = result.message || "Submission failed.";
      feedback.style.color = "#e53e3e";
    }

  } catch (error) {
    feedback.textContent = "Server error. Please try again.";
    feedback.style.color = "#e53e3e";
  }

});