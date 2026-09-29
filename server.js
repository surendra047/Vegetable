const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const products = [
  {
    id: 1,
    name: 'Organic Spinach',
    category: 'Leafy Greens',
    price: 3.5,
    unit: 'bunch',
    rating: 4.8,
    description: 'Fresh spinach rich in iron and vitamins for smoothies and curries.',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    name: 'Red Tomatoes',
    category: 'Vegetables',
    price: 4.2,
    unit: 'kg',
    rating: 4.9,
    description: 'Farm-fresh tomatoes with a juicy texture and bright flavor.',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    name: 'Carrot Basket',
    category: 'Roots',
    price: 2.8,
    unit: 'kg',
    rating: 4.7,
    description: 'Sweet and crunchy carrots picked daily for salads and soups.',
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    name: 'Cucumber',
    category: 'Fresh Picks',
    price: 2.4,
    unit: 'piece',
    rating: 4.6,
    description: 'Cool, crisp cucumbers ideal for detox drinks and salads.',
    image: 'https://images.unsplash.com/photo-1601493710606-5d2d9c52a3d8?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 5,
    name: 'Broccoli',
    category: 'Healthy Veg',
    price: 3.9,
    unit: 'head',
    rating: 4.8,
    description: 'Nutritious and vibrant broccoli perfect for roasting or steaming.',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 6,
    name: 'Bell Peppers',
    category: 'Colorful Veg',
    price: 5.1,
    unit: 'pack',
    rating: 4.9,
    description: 'Colorful peppers with fresh crunch and a naturally sweet taste.',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=900&q=80'
  }
];

const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@greencart.com',
    password: 'admin123',
    role: 'admin'
  }
];

const orders = [];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const alreadyExists = users.some((user) => user.email.toLowerCase() === String(email).toLowerCase());
  if (alreadyExists) {
    return res.status(409).json({ error: 'User already exists.' });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role: 'customer'
  };

  users.push(newUser);
  return res.status(201).json({
    message: 'Account created successfully.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = users.find(
    (entry) => entry.email.toLowerCase() === String(email).toLowerCase() && entry.password === String(password)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const payload = req.body || {};

  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    return res.status(400).json({ error: 'Order items are required.' });
  }

  const order = {
    id: `ORD-${Date.now()}`,
    customerName: payload.customerName || 'Guest Customer',
    phone: payload.phone || '',
    address: payload.address || '',
    city: payload.city || '',
    paymentMethod: payload.paymentMethod || 'Cash on Delivery',
    items: payload.items,
    total: Number(payload.total || 0),
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  return res.status(201).json({ message: 'Order placed successfully.', order });
});

app.post('/api/chat', async (req, res) => {
  const message = req.body?.message?.trim();

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const systemPrompt = `You are GreenCart AI, a helpful assistant for an online vegetable shop. Recommend products, answer questions about freshness, nutrition, pricing, and delivery. Keep replies friendly, concise, and practical. The user message is: ${message}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = await response.json();
    const answer = data.response || 'I can help you choose fresh vegetables for your order.';

    return res.json({ answer });
  } catch (error) {
    console.error('Ollama error:', error.message);
    return res.json({
      answer: 'Ollama is not running or the selected model is unavailable. Please start Ollama locally and install the model with: ollama pull llama3.2:latest'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Vegetable shop running at http://localhost:${PORT}`);
  console.log(`Ollama endpoint: ${OLLAMA_URL}`);
  console.log(`Model: ${OLLAMA_MODEL}`);
});
