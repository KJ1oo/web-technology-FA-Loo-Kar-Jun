const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const app = express();
const PORT = 3000;

app.use(session({
    secret: 'asdfghjkl',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('Database error:', err.message);
  else {
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT CHECK(category IN ('Lost','Found')) NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        contact TEXT NOT NULL,
        status TEXT DEFAULT 'Active'
     )`);
  }
});

// ===============================================
// PUBLIC ROUTE – NO LOGIN REQUIRED
// ===============================================
app.get('/api/public/items', (req, res) => {
    db.all('SELECT * FROM items ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(rows);
    });
});

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/admin/login');
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/announcements', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'announcement.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'report.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/admin/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        req.session.authenticated = true;
        req.session.username = username;
        console.log(`✅ Admin logged in: ${username}`);
        return res.redirect('/admin');
    }
    
    console.log(`❌ Failed login: ${username}`);
    res.redirect('/admin/login?error=1');
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Admin data
app.get('/admin/data', requireAuth, (req, res) => {
    console.log('📊 Admin data requested by:', req.session.username);
    
    db.all('SELECT * FROM items', (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/admin/items/:id/status', requireAuth, (req, res) => {

    const { status } = req.body;

    if (!['Active','Claimed','Resolved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    db.run(
        'UPDATE items SET status = ? WHERE id = ?',
        [status, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ message: "Database error" });

            res.json({ message: "Status updated successfully" });
        }
    );
});


// Clear data
app.delete('/admin/clear', requireAuth, (req, res) => {
    console.log('🗑️ Clearing data by:', req.session.username);
    
    db.run('DELETE FROM registrations', function(err) {
        if (err) {
            console.error('Clear error:', err.message);
            return res.status(500).json({ message: 'Failed to clear data' });
        }
        
        res.json({ 
            message: `Cleared ${this.changes} records`,
            cleared: this.changes 
        });
    });
});

app.delete('/admin/items/:id', requireAuth, (req, res) => {

    db.run('DELETE FROM items WHERE id = ?', [req.params.id], function(err) {

        if (err) return res.status(500).json({ message: "Database error" });

        res.json({ message: "Item deleted successfully" });
    });
});


app.post('/api/items', (req, res) => {

    const { title, description, category, location, date, contact, status } = req.body;

    // SERVER-SIDE VALIDATION
    if (!title || !description || !category || !location || !date || !contact) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (!['Lost','Found'].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
    }

    db.run(
        `INSERT INTO items 
        (title, description, category, location, date, contact, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, category, location, date, contact, status || 'Active'],
        function(err) {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            res.json({ message: "Item report submitted successfully" });
        }
    );
});

app.delete('/admin/clear', (req, res) => {
    console.log('Clearing all registration data');
    
    db.serialize(() => {
        // Delete all records
        db.run('delete from registrations', function(err) {
            if (err) {
                console.error('Clear error:', err.message);
                return res.status(500).json({ 
                    message: 'Failed to clear data' 
                });
            }
            
            const changes = this.changes;
            
            // Reset auto-increment counter
            db.run('delete from sqlite_sequence WHERE name="registrations"', (err) => {
                console.log(`Cleared ${changes} records. ID counter reset.`);
                res.json({ 
                    message: `Cleared ${changes} records. ID counter reset to 1.`,
                    cleared: changes 
                });
            });
        });
    });
});

app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});