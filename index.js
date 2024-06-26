import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const host = '0.0.0.0';
const porta = 3000;

const app = express();

const validUsers = [
    { nome: "ADM", email: "teste@exemplo.com", senha: "123456" },
    { nome: "Victor", email: "victor@exemplo.com", senha: "123456"}
];

app.use(express.static(path.join(process.cwd(), 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'seu-segredo',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login.html');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const user = validUsers.find(user => user.email === email && user.senha === senha);

    if (user) {
        req.session.user = email;
        req.session.nome = user.nome;
        const lastAccess = new Date().toString();
        res.cookie('lastAccess', lastAccess, { maxAge: 30 * 60 * 1000, httpOnly: false });
        res.status(200).json({ success: true, lastAccess });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/registrar', (req, res) => {
    const { nome, email, senha } = req.body;

    const userExists = validUsers.find(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Email já registrado" });
    }

    validUsers.push({nome, email, senha });
    res.status(200).json({ success: true });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.get('/index', isAuthenticated, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/listarUsuarios', isAuthenticated, (req, res) => {
    const currentUserEmail = req.session.user;
    const nomes = validUsers
        .filter(user => user.email !== currentUserEmail)
        .map(user => user.nome);
    res.json(nomes);
});

app.get('/chat', isAuthenticated, (req, res) => {
    const user = req.query.user;
    res.sendFile(path.join(process.cwd(), 'public', 'chat.html'));
});

const messages = {};

app.post('/sendMessage', isAuthenticated, (req, res) => {
    const { to, content } = req.body;
    // const from = req.session.user;
    const from = req.session.nome;
    
    if (!messages[from]) {
        messages[from] = {};
    }
    if (!messages[to]) {
        messages[to] = {};
    }
    
    if (!messages[from][to]) {
        messages[from][to] = [];
    }
    if (!messages[to][from]) {
        messages[to][from] = [];
    }
    
    const message = { from, to, content, timestamp: new Date() };
    messages[from][to].push(message);
    messages[to][from].push(message);
    
    res.status(200).json({ success: true });
});

app.get('/getMessages', isAuthenticated, (req, res) => {
    const { withUser } = req.query;
    const user = req.session.user;
    const nome = req.session.nome;
    console.log(messages[nome])

    if (messages[nome] && messages[nome][withUser]) {
        res.status(200).json(messages[nome][withUser]);
    } else {
        res.status(200).json([]);
    }
});

app.listen(porta, host, () => {
    console.log(`Servidor está executando em http://${host}:${porta}/index`);
});