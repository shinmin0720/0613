import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 사용자가 제공했던 Firebase 설정 (직접 삽입)
const firebaseConfig = {
  apiKey: "AIzaSyAn-RAQS8pBcJfY7ZtUKsK1KrDLAU9FbvU",
  authDomain: "todolist-6855b.firebaseapp.com",
  projectId: "todolist-6855b",
  storageBucket: "todolist-6855b.firebasestorage.app",
  messagingSenderId: "349792986076",
  appId: "1:349792986076:web:77c39285f521082e956519"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleBtn = document.getElementById('toggle-btn');
const toggleText = document.getElementById('auth-toggle');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// State
let isLoginMode = true;
let unsubscribeTodos = null;

// UI Toggle for Login/Signup
toggleBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? '로그인' : '회원가입';
  authBtn.textContent = isLoginMode ? '로그인' : '가입하기';
  toggleText.innerHTML = isLoginMode 
    ? `계정이 없으신가요? <span id="toggle-btn">회원가입</span>` 
    : `이미 계정이 있으신가요? <span id="toggle-btn">로그인</span>`;
  
  // Re-attach event listener to new span
  document.getElementById('toggle-btn').addEventListener('click', () => toggleBtn.click());
});

// Auth Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.classList.add('hidden');
    todoSection.classList.remove('hidden');
    loadTodos(user.uid);
  } else {
    authSection.classList.remove('hidden');
    todoSection.classList.add('hidden');
    if (unsubscribeTodos) {
      unsubscribeTodos();
      unsubscribeTodos = null;
    }
  }
});

// Handle Login/Signup
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    emailInput.value = '';
    passwordInput.value = '';
  } catch (error) {
    alert(`오류가 발생했습니다: ${error.message}`);
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// Add Todo
todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, 'todos'), {
      text: text,
      completed: false,
      userId: user.uid,
      createdAt: new Date()
    });
    todoInput.value = '';
  } catch (error) {
    console.error("Error adding document: ", error);
  }
});

// Load Todos Real-time
function loadTodos(userId) {
  const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'));
  
  unsubscribeTodos = onSnapshot(q, (snapshot) => {
    todoList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const todo = docSnap.data();
      // Only show user's own todos (though security rules should enforce this)
      if (todo.userId === userId) {
        renderTodo(docSnap.id, todo);
      }
    });
  });
}

// Render Todo Item
function renderTodo(id, todo) {
  const li = document.createElement('li');
  li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
  
  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;
  span.addEventListener('click', async () => {
    await updateDoc(doc(db, 'todos', id), { completed: !todo.completed });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '삭제';
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteDoc(doc(db, 'todos', id));
  });

  li.appendChild(span);
  li.appendChild(deleteBtn);
  todoList.appendChild(li);
}
