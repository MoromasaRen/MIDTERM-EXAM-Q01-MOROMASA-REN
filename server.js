const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.tickets) ? parsed.tickets : [];
  } catch (error) {
    return [];
  }
}

function writeData(tickets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ tickets }, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /api/tickets
app.get('/api/tickets', (req, res) => {
  const tickets = readData();
  res.status(200).json(tickets);
});

// GET /api/tickets/:id
app.get('/api/tickets/:id', (req, res) => {
  const tickets = readData();
  const ticket = tickets.find((p) => String(p.id) === String(req.params.id));

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket record not found' });
  }

  res.status(200).json(ticket);
});

// POST /api/tickets
app.post('/api/tickets', (req, res) => {
  const { customer_name, problem, priority } = req.body;

  if (!customer_name || !problem || !priority) {
    return res.status(400).json({
      message: 'Missing required fields: customer_name, problem, priority'
    });
  }

  const tickets = readData();
  const newTicket = {
    id: tickets.length > 0 ? Math.max(...tickets.map(t => Number(t.id))) + 1 : 1,
    customer_name,
    problem,
    priority,
    status: 'Pending'
  };

  tickets.push(newTicket);
  writeData(tickets);

  res.status(201).json({
    message: 'Ticket created successfully',
    ticket: newTicket
  });
});

// DELETE /api/tickets/:id
app.delete('/api/tickets/:id', (req, res) => {
  const tickets = readData();
  const id = Number(req.params.id);
  const index = tickets.findIndex((ticket) => Number(ticket.id) === id || String(ticket.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  const [deletedTicket] = tickets.splice(index, 1);
  writeData(tickets);

  res.json({
    message: 'Ticket deleted successfully',
    ticket: deletedTicket
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
