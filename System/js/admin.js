document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.getElementById('load');
    const clearBtn = document.getElementById('clear');
    const countSpan = document.getElementById('count');
    const messageDiv = document.getElementById('message');
    const userTable = document.getElementById('userTable');
    const tableBody = document.getElementById('list');
    
    // Load records
    loadBtn.addEventListener('click', async () => {
        try {
            loadBtn.textContent = '⏳ Loading...';
            loadBtn.disabled = true;
            
            const res = await fetch('/admin/data');
            
            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }
            
            const data = await res.json();
            
            // Update count
            countSpan.textContent = data.length;
            
            // Clear previous data
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                messageDiv.innerHTML = '<div class="alert alert-error">No registrations found</div>';
                userTable.style.display = 'none';
                return;
            }
            
            // Show table
            userTable.style.display = 'table';
            messageDiv.innerHTML = '';




            data.forEach(item => {

                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.title}</td>
                    <td>${item.category}</td>
                    <td>${item.location}</td>
                    <td>${item.date}</td>
                    <td>
                        <select onchange="updateStatus(${item.id}, this.value)">
                            <option ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option ${item.status === 'Claimed' ? 'selected' : ''}>Claimed</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="deleteItem(${item.id})">Delete</button>
                    </td>
                `;

                tableBody.appendChild(row);
            });
            


            messageDiv.innerHTML = `<div class="alert alert-success">✅ Loaded ${data.length} registration(s)</div>`;
            
        } catch (error) {
            console.error('Error loading data:', error);
            messageDiv.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
        } finally {
            loadBtn.textContent = '📋 Load All Records';
            loadBtn.disabled = false;
        }
    });
    
    // Clear data button
    clearBtn.addEventListener('click', async () => {
        if (!confirm('⚠️ WARNING: This will delete ALL registration data. This action cannot be undone!')) {
            return;
        }
        
        try {
            clearBtn.textContent = '⏳ Clearing...';
            clearBtn.disabled = true;
            
            const res = await fetch('/admin/clear', {
                method: 'DELETE'
            });
            
            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }
            
            const result = await res.json();
            
            tableBody.innerHTML = '';
            userTable.style.display = 'none';
            countSpan.textContent = '0';
            
            messageDiv.innerHTML = `<div class="alert alert-success">✅ ${result.message}</div>`;
            
        } catch (error) {
            console.error('Error clearing data:', error);
            messageDiv.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
        } finally {
            clearBtn.textContent = '🗑️ Clear All Data';
            clearBtn.disabled = false;
        }
    });
});


async function updateStatus(id, status) {
    await fetch(`/admin/items/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
}

async function deleteItem(id) {
    if (!confirm("Delete this item?")) return;

    await fetch(`/admin/items/${id}`, {
        method: 'DELETE'
    });

    location.reload();
}