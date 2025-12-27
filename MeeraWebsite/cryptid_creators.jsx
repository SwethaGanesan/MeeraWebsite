import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  BookOpen, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Wand2, 
  Star, 
  Send,
  Camera,
  Heart,
  BookMarked,
  Loader2,
  Lock,
  CheckCircle,
  Clock,
  ExternalLink,
  Mail,
  AlertCircle,
  ArrowRight,
  User,
  UserPlus,
  KeyRound,
  Image as ImageIcon,
  Save,
  Trash2,
  Plus,
  LogOut,
  FileImage,
  Globe,
  FlaskConical,
  X,
  Download
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cryptid-creators-default';

const apiKey = "";

const PRESET_CHARACTERS = [
  { id: 'nessie', name: 'Nessie the Friendly Monster', icon: '🦕', color: 'bg-emerald-100', isPreset: true },
  { id: 'bigfoot', name: 'Barnaby Bigfoot', icon: '👣', color: 'bg-orange-100', isPreset: true },
  { id: 'dragon', name: 'Sparkle the Dragon', icon: '🐲', color: 'bg-purple-100', isPreset: true },
  { id: 'unicorn', name: 'Crystal Unicorn', icon: '🦄', color: 'bg-pink-100', isPreset: true },
  { id: 'owl', name: 'Ollie the Wise Owl', icon: '🦉', color: 'bg-amber-100', isPreset: true },
  { id: 'mothman', name: 'Mothie the Night Moth', icon: '🦋', color: 'bg-indigo-100', isPreset: true },
];

const MEERAS_BOOKS = [
  { title: "The Whispering Woods", authorName: "Meera", description: "Follow Barnaby Bigfoot as he searches for the lost Golden Acorn.", color: "bg-green-500", image: "🌲", isSample: true, pages: [{text: "Follow Barnaby Bigfoot as he searches for the lost Golden Acorn.", imageUrl: null}] },
  { title: "A Tea Party at the Loch", authorName: "Meera", description: "Nessie hosts a secret party under the waves for her fishy friends.", color: "bg-blue-400", image: "🫖", isSample: true, pages: [{text: "Nessie hosts a secret party under the waves for her fishy friends.", imageUrl: null}] },
  { title: "Cloud Dragon's Picnic", authorName: "Meera", description: "High above the mountains, dragons feast on marshmallows and rainbows.", color: "bg-purple-400", image: "☁️", isSample: true, pages: [{text: "High above the mountains, dragons feast on marshmallows and rainbows.", imageUrl: null}] }
];

// --- Reliable API Helper ---
const callAI = async (url, payload, retries = 5) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API call failed');
      return data;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

// --- Sub-Components (Passed Props to prevent re-mounting) ---

const BookEditor = ({ editingBook, setEditingBook, loadingAI, publishStatus, onPublish, onGenerateImage, errorMessage }) => {
  const [pageLoading, setPageLoading] = useState(null);
  const fileInputRefs = useRef([]);

  const updatePageText = (index, newText) => {
    const newPages = [...editingBook.pages];
    newPages[index].text = newText;
    setEditingBook({ ...editingBook, pages: newPages });
  };

  const handleFileUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPages = [...editingBook.pages];
        newPages[index].imageUrl = reader.result;
        setEditingBook({ ...editingBook, pages: newPages });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 animate-in zoom-in duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Editing: {editingBook.title}</h3>
          <p className="text-slate-500 font-medium">Author: {editingBook.authorName}</p>
        </div>
        <button onClick={() => setEditingBook(null)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-3 rounded-full"><X size={20} /></button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-5 bg-red-50 text-red-700 rounded-3xl flex items-start gap-3 border border-red-100 animate-in shake">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-bold leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-12">
        {editingBook.pages.map((page, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg">
                  {idx + 1}
                </span>
                <button onClick={() => setEditingBook({...editingBook, pages: editingBook.pages.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
              </div>
              <textarea 
                className="w-full p-5 rounded-3xl border-2 border-transparent focus:border-purple-300 outline-none h-40 bg-white resize-none text-slate-700 font-medium leading-relaxed shadow-sm" 
                value={page.text} 
                onChange={(e) => updatePageText(idx, e.target.value)} 
                placeholder="Type the magic here..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    setPageLoading(idx);
                    await onGenerateImage(idx);
                    setPageLoading(null);
                  }} 
                  disabled={pageLoading !== null} 
                  className="flex-1 bg-white border-2 border-purple-200 text-purple-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-50 disabled:opacity-50 text-sm transition-all"
                >
                  {pageLoading === idx ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}AI Art
                </button>
                <button onClick={() => fileInputRefs.current[idx]?.click()} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 text-sm transition-all"><FileImage size={18} />Upload</button>
                <input type="file" accept="image/*" hidden ref={el => fileInputRefs.current[idx] = el} onChange={(e) => handleFileUpload(idx, e)} />
              </div>
            </div>
            <div className="h-72 rounded-[32px] bg-white border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative shadow-inner">
              {page.imageUrl ? <img src={page.imageUrl} className="w-full h-full object-cover" alt="illustration" /> : <ImageIcon size={64} className="text-slate-100" />}
              {pageLoading === idx && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                  <Loader2 className="animate-spin text-purple-600 mb-3" size={40} />
                  <span className="text-xs font-black text-purple-600 uppercase tracking-widest animate-pulse">Meera is painting...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => setEditingBook({...editingBook, pages: [...editingBook.pages, {text: '', imageUrl: null}]})} className="w-full border-4 border-dashed border-slate-200 p-8 rounded-[40px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-purple-200 hover:text-purple-400 transition-all group">
            <Plus size={28} className="group-hover:scale-125 transition-transform" /> 
            Add Next Page
        </button>
      </div>

      <div className="mt-12 pt-10 border-t border-slate-100">
        <button onClick={onPublish} disabled={loadingAI || editingBook.pages.length === 0} className="w-full bg-purple-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-purple-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 hover:-translate-y-0.5">
          {loadingAI ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />} 
          {publishStatus || "Publish & Download PDF"}
        </button>
      </div>
    </div>
  );
};

const BookReader = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  if (!book || !book.pages || book.pages.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 md:p-10 backdrop-blur-xl animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={24} /></button>
      <div className="max-w-6xl w-full bg-white rounded-[50px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-full max-h-[850px] animate-in zoom-in duration-500">
        <div className="flex-1 relative bg-slate-50">
          {book.pages[currentPage]?.imageUrl ? <img src={book.pages[currentPage].imageUrl} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Page" /> : <div className="w-full h-full flex items-center justify-center bg-purple-50"><ImageIcon size={100} className="text-purple-100" /></div>}
          <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Page {currentPage + 1} of {book.pages.length}</div>
        </div>
        <div className="w-full md:w-[480px] p-10 md:p-16 flex flex-col justify-center bg-white border-l border-slate-50">
          <h3 className="text-xs font-black text-purple-600 mb-8 uppercase tracking-[0.3em]">{book.title}</h3>
          <p className="text-2xl md:text-4xl font-serif text-slate-800 italic leading-relaxed mb-16 animate-in slide-in-from-bottom-5 duration-700">"{book.pages[currentPage]?.text}"</p>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="bg-slate-50 text-slate-400 py-5 rounded-[24px] font-black uppercase tracking-widest disabled:opacity-30 border border-slate-100 hover:bg-slate-100 transition-all">Back</button>
            <button disabled={currentPage === book.pages.length - 1} onClick={() => setCurrentPage(prev => prev + 1)} className="bg-purple-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest disabled:opacity-30 shadow-xl hover:bg-purple-700 transition-all hover:scale-105 active:scale-95">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeAuthor, setActiveAuthor] = useState(() => localStorage.getItem(`cryptid_author_${appId}`) || null); 
  const [view, setView] = useState('home'); 
  const [loadingAI, setLoadingAI] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [activeBook, setActiveBook] = useState(null);
  const [activePreviewBook, setActivePreviewBook] = useState(0);
  const [step, setStep] = useState(1);
  const [allRequests, setAllRequests] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);
  const [publishedBooks, setPublishedBooks] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [customCharacters, setCustomCharacters] = useState([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState('stories'); 
  const [errorMessage, setErrorMessage] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [adminLoadingId, setAdminLoadingId] = useState(null); 
  
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [newCharData, setNewCharData] = useState({ name: '', image: null });

  const [loginName, setLoginName] = useState('');
  const [magicWord, setMagicWord] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [formData, setFormData] = useState({
    character: null,
    customImage: null,
    title: '',
    synopsis: '',
    status: 'pending'
  });

  // Load jsPDF
  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (activeAuthor) {
      localStorage.setItem(`cryptid_author_${appId}`, activeAuthor);
    } else {
      localStorage.removeItem(`cryptid_author_${appId}`);
    }
  }, [activeAuthor]);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    onAuthStateChanged(auth, setSessionUser);
  }, []);

  useEffect(() => {
    if (!sessionUser) return;
    const reqCollection = collection(db, 'artifacts', appId, 'public', 'data', 'bookRequests');
    const unsubStories = onSnapshot(reqCollection, (snapshot) => {
      const reqs = snapshot.docs.map(doc => {
        const data = doc.data();
        let parsedPages = [];
        // RULE: Nested arrays/objects stringified for Firestore stability
        try {
          parsedPages = typeof data.pages === 'string' ? JSON.parse(data.pages) : (data.pages || []);
        } catch(e) { parsedPages = []; }
        return { id: doc.id, ...data, pages: parsedPages };
      });
      setAllRequests(reqs);
      setPublishedBooks(reqs.filter(r => r.status === 'ready'));
      setUserRequests(reqs.filter(r => r.authorName === activeAuthor));
    }, (err) => {
      console.error(err);
      setErrorMessage("Library connection interrupted.");
    });

    const authorCollection = collection(db, 'artifacts', appId, 'public', 'data', 'magicAccounts');
    const unsubAuthors = onSnapshot(authorCollection, (snapshot) => {
      setAllAuthors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (activeAuthor) {
      const authorId = activeAuthor.toLowerCase().replace(/\s+/g, '-');
      const charCollection = collection(db, 'artifacts', appId, 'public', 'data', 'magicAccounts', authorId, 'characters');
      const unsubChars = onSnapshot(charCollection, (snapshot) => {
        setCustomCharacters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubStories(); unsubAuthors(); unsubChars(); };
    }
    return () => { unsubStories(); unsubAuthors(); };
  }, [sessionUser, activeAuthor]);

  const fetchGemini = async (prompt, systemInstruction = "You are Meera, a magical storybook creator.") => {
    const result = await callAI(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`, {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text;
  };

  const generateIllustration = async (pageText, characterName) => {
    try {
      const prompt = `Children's book art for ${characterName}. Scene: ${pageText}. Whimsical, soft colors, no text.`;
      const result = await callAI(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`, {
        instances: [{ prompt }], parameters: { sampleCount: 1 }
      });
      return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    } catch (err) { return null; }
  };

  const handleMagicAuth = async () => {
    if (!loginName.trim() || magicWord.length < 4) {
      setErrorMessage("Names and Words must be 4+ letters!");
      return;
    }
    setAuthLoading(true);
    setErrorMessage(null);
    const authorId = loginName.trim().toLowerCase().replace(/\s+/g, '-');
    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'magicAccounts', authorId);
    try {
      const userDoc = await getDoc(userDocRef);
      if (isLoginMode) {
        if (!userDoc.exists() || userDoc.data().magicWord !== magicWord) {
          setErrorMessage("Incorrect Magic Name or Word!");
        } else {
          setActiveAuthor(userDoc.data().displayName);
          setView('home');
        }
      } else {
        if (userDoc.exists()) setErrorMessage("That name is taken!");
        else {
          await setDoc(userDocRef, { displayName: loginName.trim(), magicWord, createdAt: new Date().toISOString() });
          setActiveAuthor(loginName.trim());
          setView('home');
        }
      }
    } catch (e) { setErrorMessage("The Magic Door is stuck."); }
    setAuthLoading(false);
  };

  const generatePlotSuggestion = async () => {
    if (!formData.title) return;
    setLoadingAI(true);
    try {
      const prompt = `BOOK TITLE: "${formData.title}", CHARACTER: ${formData.character?.name}, NOTES: "${formData.synopsis.trim() || "None"}". Expand into 3 whimsical story sentences. USE THE AUTHOR'S NOTES.`;
      const res = await fetchGemini(prompt, "You are Meera. You strictly follow and expand author's notes.");
      if (res) setFormData(prev => ({ ...prev, synopsis: res }));
    } catch (e) { setErrorMessage("The quill ran dry."); }
    setLoadingAI(false);
  };

  const handleSendToMeera = async () => {
    setStep(3); 
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookRequests'), { 
        ...formData, 
        authorName: activeAuthor, 
        userId: sessionUser.uid, 
        createdAt: new Date().toISOString(), 
        status: 'pending', 
        pages: JSON.stringify([]) // Consistently stringify arrays
      });
      setStep(4);
    } catch (e) { setStep(2); }
  };

  const deleteCharacter = async (charId) => {
    if (!activeAuthor) return;
    try {
      const authorId = activeAuthor.toLowerCase().replace(/\s+/g, '-');
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'magicAccounts', authorId, 'characters', charId));
    } catch (err) { console.error(err); }
  };

  const saveNewCharacter = async () => {
    if (!newCharData.name || !newCharData.image || !activeAuthor) return;
    setAuthLoading(true);
    try {
      const authorId = activeAuthor.toLowerCase().replace(/\s+/g, '-');
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'magicAccounts', authorId, 'characters'), { ...newCharData, imageUrl: newCharData.image, icon: '🎨', createdAt: new Date().toISOString() });
      setIsCreatingCharacter(false);
      setNewCharData({ name: '', image: null });
    } catch (err) { console.error(err); }
    setAuthLoading(false);
  };

  const startDraftingBook = async (req) => {
    setAdminLoadingId(req.id);
    setErrorMessage(null);
    try {
      const prompt = `Story for ${req.character.name}: "${req.synopsis}". Return JSON: [{"text": "sentence"}]. 4 pages.`;
      const result = await callAI(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const pages = JSON.parse(result.candidates[0].content.parts[0].text);
      setEditingBook({ ...req, pages: pages.map(p => ({ ...p, imageUrl: null })) });
    } catch (e) { 
      setErrorMessage("Brainstorming failed. Try drafting again.");
    }
    setAdminLoadingId(null);
  };

  const downloadPDF = async (book) => {
    if (!window.jspdf) return false;
    try {
      const { jsPDF } = window.jspdf;
      const docPdf = new jsPDF();
      for (let i = 0; i < book.pages.length; i++) {
        if (i > 0) docPdf.addPage();
        const page = book.pages[i];
        docPdf.setFontSize(22);
        docPdf.setTextColor(147, 51, 234);
        docPdf.text(book.title, 105, 20, { align: 'center' });
        docPdf.setFontSize(12);
        docPdf.setTextColor(100, 116, 139);
        docPdf.text(`By Author: ${book.authorName}`, 105, 30, { align: 'center' });
        if (page.imageUrl) {
          try { docPdf.addImage(page.imageUrl, 'PNG', 15, 40, 180, 120); } catch (e) {}
        }
        docPdf.setFontSize(14);
        docPdf.setTextColor(30, 41, 59);
        const lines = docPdf.splitTextToSize(page.text || "...", 170);
        docPdf.text(lines, 20, 175);
        docPdf.setFontSize(10);
        docPdf.setTextColor(180);
        docPdf.text(`Page ${i + 1}`, 105, 285, { align: 'center' });
      }
      docPdf.save(`${book.title.replace(/\s+/g, '_')}_CryptidCreators.pdf`);
      return true;
    } catch (e) { return false; }
  };

  const publishBook = async () => {
    setLoadingAI(true);
    setErrorMessage(null);
    setPublishStatus("Saving to Cloud Library...");
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookRequests', editingBook.id);
      // RULE: Property array JSON serialized to avoid "invalid nested entity" error
      await updateDoc(docRef, { 
        status: 'ready', 
        pages: JSON.stringify(editingBook.pages), 
        publishedAt: new Date().toISOString() 
      });
      setPublishStatus("Finalizing PDF...");
      await downloadPDF(editingBook);
      setEditingBook(null);
    } catch (e) {
      console.error(e);
      if (e.message?.includes('too large')) {
        setErrorMessage("This book is too large for the cloud gallery! We'll try to download the PDF for you anyway.");
        await downloadPDF(editingBook);
      } else {
        setErrorMessage("Magic error! Please try publishing one more time.");
      }
    }
    setLoadingAI(false);
    setPublishStatus(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-slate-800 font-sans selection:bg-purple-100">
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('home'); setStep(1); }}>
          <div className="bg-purple-600 p-2 rounded-2xl shadow-lg transition-transform hover:scale-110 active:scale-95"><BookMarked className="text-white" /></div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Cryptid Creators</h1>
        </div>
        <div className="flex gap-4 items-center">
            {activeAuthor && <button onClick={() => setView('character-lab')} className="text-slate-600 font-black text-sm uppercase tracking-widest hover:text-purple-600 transition-colors flex items-center gap-1"><FlaskConical size={18} /> Lab</button>}
            {activeAuthor && userRequests.length > 0 && <button onClick={() => setView('user-requests')} className="text-slate-600 font-black text-sm uppercase tracking-widest hover:text-purple-600">Stories ({userRequests.length})</button>}
            <button onClick={() => activeAuthor ? setView('create') : setView('user-login')} className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"><Wand2 size={18} /> {activeAuthor ? "Create" : "Join"}</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 min-h-[70vh]">
        {editingBook ? (
          <BookEditor editingBook={editingBook} setEditingBook={setEditingBook} loadingAI={loadingAI} publishStatus={publishStatus} onPublish={publishBook} errorMessage={errorMessage} onGenerateImage={async (idx) => {
              const url = await generateIllustration(editingBook.pages[idx].text, editingBook.character.name);
              if (url) {
                const np = [...editingBook.pages]; np[idx].imageUrl = url;
                setEditingBook({...editingBook, pages: np});
              }
            }}
          />
        ) : (
          <>
            {view === 'home' && (
              <div className="animate-in fade-in duration-700">
                <section className="text-center py-12 md:py-24">
                  <div className="inline-block bg-white px-5 py-2 rounded-full text-purple-600 font-black text-xs uppercase tracking-[0.2em] mb-6 border border-purple-50 shadow-sm">
                    {activeAuthor ? `Author: ${activeAuthor} ✨` : "✨ JOIN THE CLUB"}
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] text-slate-900 tracking-tighter">Magic Stories for <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Little Adventurers</span></h2>
                  <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">Invent monsters in the Lab, write your plot, and Meera will help you paint the pages into a real storybook!</p>
                  {activeAuthor && <button onClick={() => { setActiveAuthor(null); setView('home'); }} className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-red-500 transition-colors mx-auto flex items-center gap-2 border border-slate-100 px-4 py-2 rounded-full"><LogOut size={14} /> Log Out</button>}
                </section>
                <section className="mb-24">
                  <div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Meera's Favorites</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setActivePreviewBook(p => (p-1+MEERAS_BOOKS.length)%MEERAS_BOOKS.length)} className="p-3 rounded-full border bg-white hover:shadow-md transition-all active:scale-90 shadow-sm"><ChevronLeft /></button>
                      <button onClick={() => setActivePreviewBook(p => (p+1)%MEERAS_BOOKS.length)} className="p-3 rounded-full border bg-white hover:shadow-md transition-all active:scale-90 shadow-sm"><ChevronRight /></button>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-[50px] h-[480px] shadow-2xl border border-slate-100">
                    {MEERAS_BOOKS.map((book, idx) => (
                      <div key={idx} className={`absolute inset-0 transition-all duration-1000 flex flex-col md:flex-row items-center gap-12 p-12 ${idx === activePreviewBook ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} style={{background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)'}}>
                        <div className={`w-full md:w-1/2 h-64 md:h-full rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center text-9xl ${book.color} text-white transform hover:rotate-3 transition-transform duration-500`}>{book.image}</div>
                        <div className="flex-1 text-left"><h4 className="text-4xl font-black mb-4 text-slate-900 tracking-tighter uppercase leading-none">{book.title}</h4><p className="text-xl text-slate-600 italic mb-10 leading-relaxed font-serif">"{book.description}"</p><button onClick={() => setActiveBook(book)} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-purple-900 transition-all shadow-xl active:scale-95">Read Now ✨</button></div>
                      </div>
                    ))}
                  </div>
                </section>
                {publishedBooks.length > 0 && (
                  <section className="pb-24 animate-in slide-up duration-1000">
                    <div className="flex items-center gap-3 mb-10"><Globe className="text-blue-500" size={32} /><h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Author Gallery</h3></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                      {publishedBooks.map(book => (
                        <div key={book.id} onClick={() => setActiveBook(book)} className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                          <div className="h-56 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                            {book.pages?.[0]?.imageUrl ? <img src={book.pages[0].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="cover" /> : <div className="text-7xl">{book.character?.icon || "📖"}</div>}
                          </div>
                          <div className="p-8">
                            <h4 className="font-black text-xl mb-2 text-slate-900 tracking-tight leading-tight">"{book.title}"</h4>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">By {book.authorName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {view === 'user-login' && (
                <div className="max-w-md mx-auto py-12 bg-white p-12 rounded-[50px] shadow-[0_30px_100px_rgba(147,51,234,0.1)] border border-purple-50 text-center animate-in zoom-in">
                    <div className="w-24 h-24 bg-purple-100 rounded-[35px] flex items-center justify-center text-4xl mx-auto mb-8 text-purple-600 shadow-inner">{isLoginMode ? <KeyRound size={48} /> : <UserPlus size={48} />}</div>
                    <h2 className="text-4xl font-black mb-10 text-slate-900 tracking-tighter uppercase">{isLoginMode ? "Come On In!" : "Join the Club!"}</h2>
                    <div className="space-y-4 text-left">
                        <input placeholder="MAGIC NAME" className="w-full p-6 rounded-[25px] border-2 border-slate-100 outline-none focus:border-purple-500 font-black uppercase tracking-widest text-sm bg-slate-50/50" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
                        <input type="password" placeholder="MAGIC WORD" className="w-full p-6 rounded-[25px] border-2 border-slate-100 outline-none focus:border-purple-500 font-black uppercase tracking-widest text-sm bg-slate-50/50" value={magicWord} onChange={(e) => setMagicWord(e.target.value)} />
                    </div>
                    {errorMessage && <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-3xl text-xs font-black uppercase tracking-widest animate-in shake">{errorMessage}</div>}
                    <button onClick={handleMagicAuth} className="w-full bg-purple-600 text-white py-6 rounded-[25px] font-black uppercase tracking-[0.2em] shadow-xl mt-10 hover:bg-purple-700 transition-all flex items-center justify-center gap-3">{authLoading ? <Loader2 className="animate-spin" /> : (isLoginMode ? "Unlock Library" : "Start Adventure")}</button>
                    <button onClick={() => { setIsLoginMode(!isLoginMode); setErrorMessage(null); }} className="mt-8 text-purple-600 font-black text-xs uppercase tracking-widest hover:underline block mx-auto">{isLoginMode ? "New Author? Join here!" : "Already have a name? Login!"}</button>
                </div>
            )}

            {view === 'character-lab' && <CharacterLab customCharacters={customCharacters} isCreatingCharacter={isCreatingCharacter} setIsCreatingCharacter={setIsCreatingCharacter} newCharData={newCharData} setNewCharData={setNewCharData} saveNewCharacter={saveNewCharacter} deleteCharacter={deleteCharacter} authLoading={authLoading} />}

            {view === 'create' && (
              <div className="max-w-4xl mx-auto py-12 animate-in slide-up">
                <div className="flex gap-4 mb-16 h-3 px-4 md:px-0">{[1, 2, 3, 4].map(i => <div key={i} className={`flex-1 rounded-full transition-all duration-700 shadow-sm ${step >= i ? 'bg-purple-600' : 'bg-slate-100'}`} />)}</div>
                {step === 1 && (
                  <div><h2 className="text-4xl font-black mb-10 text-slate-900 px-4 md:px-0 uppercase tracking-tighter">Who is the Hero?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 my-10 px-4 md:px-0">
                      {[...PRESET_CHARACTERS, ...customCharacters].map(char => (
                        <button key={char.id} onClick={() => setFormData({...formData, character: char})} className={`p-8 rounded-[40px] border-4 transition-all relative ${formData.character?.id === char.id ? 'border-purple-600 bg-purple-50 shadow-inner scale-105' : 'border-transparent bg-white shadow-xl hover:shadow-2xl hover:-translate-y-1'}`}>
                          {char.imageUrl ? <div className="h-28 w-full rounded-3xl overflow-hidden mb-5 border border-slate-100"><img src={char.imageUrl} className="w-full h-full object-cover" alt="hero" /></div> : <div className={`text-6xl mb-5 p-5 rounded-3xl ${char.color} shadow-inner`}>{char.icon}</div>}
                          <span className="font-black text-sm uppercase tracking-tight text-slate-800 leading-tight block">{char.name}</span>
                        </button>
                      ))}
                      <button onClick={() => setView('character-lab')} className="p-8 rounded-[40px] border-4 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-purple-200 transition-all group shadow-inner"><Plus size={48} className="group-hover:scale-125 transition-transform" /><span className="font-black text-xs uppercase tracking-widest">Create New</span></button>
                    </div>
                    <div className="flex justify-end px-4 md:px-0 mt-12"><button disabled={!formData.character} onClick={() => setStep(2)} className="px-12 py-5 bg-purple-600 text-white rounded-[30px] font-black uppercase tracking-widest shadow-2xl hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95">Next Step <ChevronRight className="inline ml-2" /></button></div>
                  </div>
                )}
                {step === 2 && (
                  <div className="max-w-2xl mx-auto text-center animate-in zoom-in px-4 md:px-0"><h2 className="text-4xl font-black mb-12 text-slate-900 uppercase tracking-tighter">Story Details</h2>
                    <div className="space-y-8 text-left">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">The Grand Title</label>
                        <input placeholder="Name your adventure..." className="w-full p-6 rounded-[30px] border-2 border-slate-100 outline-none focus:border-purple-500 text-xl font-bold transition-all shadow-sm bg-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">What happens?</label>
                        <div className="relative">
                          <textarea placeholder="Type your ideas here..." rows={6} className="w-full p-6 rounded-[30px] border-2 border-slate-100 outline-none focus:border-purple-500 text-lg leading-relaxed transition-all shadow-sm bg-white" value={formData.synopsis} onChange={e => setFormData({...formData, synopsis: e.target.value})} />
                          <button onClick={generatePlotSuggestion} disabled={loadingAI || !formData.title} className="absolute bottom-4 right-4 text-purple-600 font-black bg-white px-5 py-2.5 rounded-full shadow-lg border border-purple-50 hover:bg-purple-50 transition-all flex items-center gap-2 active:scale-90 text-xs uppercase tracking-widest">{loadingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Magic Plot</button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-16"><button onClick={() => setStep(1)} className="text-slate-400 font-black uppercase tracking-widest text-sm hover:text-slate-600 transition-colors p-4">Back</button><button onClick={handleSendToMeera} disabled={!formData.title} className="px-12 py-5 bg-purple-600 text-white rounded-[30px] font-black uppercase tracking-widest shadow-2xl hover:bg-purple-700 transition-all active:scale-95">Send to Meera</button></div>
                  </div>
                )}
                {step === 3 && <div className="text-center py-20 flex flex-col items-center animate-in fade-in"><Loader2 className="animate-spin text-purple-600 mb-8" size={80} /><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Publishing...</h2></div>}
                {step === 4 && <div className="text-center py-10 bg-white rounded-[50px] shadow-2xl border border-purple-100 p-16 animate-in zoom-in mx-4 md:mx-0"><div className="text-8xl mb-8">📫</div><h2 className="text-5xl font-black mb-6 text-purple-700 tracking-tighter uppercase">Success!</h2><p className="text-xl text-slate-500 mb-12 leading-relaxed font-medium">Meera has received your story request! Visit 'My Stories' later to read your finished book.</p><button onClick={() => setView('home')} className="px-16 py-6 bg-slate-900 text-white rounded-[30px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto">Back to Library</button></div>}
              </div>
            )}

            {view === 'user-requests' && (
              <div className="max-w-4xl mx-auto py-12 animate-in fade-in"><h2 className="text-4xl font-black mb-12 text-slate-900 flex items-center gap-4 px-4 md:px-0 tracking-tighter uppercase"><Sparkles className="text-purple-600" size={36} /> My Adventures</h2>
                 <div className="grid gap-8 px-4 md:px-0">
                    {userRequests.map(req => (
                        <div key={req.id} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 hover:shadow-2xl hover:-translate-y-1 transition-all">
                            <div className="flex gap-6 items-center w-full md:w-auto"><div className="text-5xl bg-purple-50 p-6 rounded-[35px] shadow-inner">{req.character?.icon || '✨'}</div><h3 className="text-2xl font-black text-slate-900 tracking-tight">"{req.title}"</h3></div>
                            <div className="flex gap-4 items-center w-full md:w-auto">
                              {req.status === 'ready' && <button onClick={() => downloadPDF(req)} className="bg-slate-50 text-slate-600 p-5 rounded-[25px] hover:bg-slate-100 transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest border border-slate-100 shadow-sm"><Download size={24} /> PDF</button>}
                              {req.status === 'ready' ? <button onClick={() => setActiveBook(req)} className="flex-1 md:flex-none bg-purple-600 text-white px-10 py-5 rounded-[25px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-purple-700 transition-all active:scale-95">Open Book</button> : <span className="flex-1 md:flex-none bg-slate-50 text-slate-400 px-8 py-5 rounded-[25px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 italic border border-slate-100"><Clock size={20} className="animate-pulse" /> Painting...</span>}
                            </div>
                        </div>
                    ))}
                    {userRequests.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] border-4 border-dashed border-slate-100 rounded-[50px]">No Stories Yet</div>}
                 </div>
              </div>
            )}

            {activeBook && <BookReader book={activeBook} onClose={() => setActiveBook(null)} />}

            {view === 'admin-login' && (
                <div className="max-w-md mx-auto py-20 text-center bg-white p-12 rounded-[50px] shadow-2xl border border-purple-100 animate-in zoom-in">
                    <h2 className="text-3xl font-black mb-10 text-slate-900 tracking-tighter uppercase">Admin Key</h2>
                    <input type="password" placeholder="SECRET CODE" className="w-full p-6 rounded-[25px] border-2 border-slate-100 mb-8 text-center outline-none focus:border-purple-500 font-black transition-all text-sm tracking-[0.3em]" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                    <button onClick={() => adminPassword === 'meera123' ? setView('admin-dashboard') : null} className="w-full bg-purple-600 text-white py-6 rounded-[25px] font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all active:scale-95">Enter Dashboard</button>
                </div>
            )}

            {view === 'admin-dashboard' && (
              <div className="max-w-6xl mx-auto p-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-slate-900 uppercase tracking-tighter"><Lock className="text-purple-600" /> Meera's Work Table</h2>
                  <div className="flex bg-white p-2 rounded-[30px] shadow-lg border border-slate-100 gap-1">
                    <button onClick={() => { setAdminTab('stories'); setErrorMessage(null); }} className={`px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-xs transition-all ${adminTab === 'stories' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>Stories</button>
                    <button onClick={() => { setAdminTab('authors'); setErrorMessage(null); }} className={`px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-xs transition-all ${adminTab === 'authors' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>Authors</button>
                  </div>
                  <button onClick={() => setView('home')} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-red-500 transition-all p-3">Logout</button>
                </div>

                {errorMessage && (
                  <div className="mb-10 p-6 bg-red-50 text-red-700 rounded-[35px] flex items-start gap-4 border border-red-100 animate-in shake shadow-sm">
                    <AlertCircle size={28} className="shrink-0" />
                    <p className="font-bold text-sm">{errorMessage}</p>
                  </div>
                )}

                {adminTab === 'stories' ? (
                  <div className="grid gap-10">
                    {allRequests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(req => (
                      <div key={req.id} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-md flex flex-col md:flex-row gap-10 items-start hover:border-purple-200 transition-all relative group overflow-hidden">
                        {adminLoadingId === req.id && (
                          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-in fade-in">
                            <Loader2 className="animate-spin text-purple-600 mb-4" size={56} />
                            <span className="text-xl font-black text-purple-600 uppercase tracking-widest animate-pulse">Brainstorming...</span>
                          </div>
                        )}
                        <div className={`p-10 rounded-[40px] text-6xl shadow-inner border border-slate-50 ${PRESET_CHARACTERS.find(c => c.id === req.character?.id)?.color || 'bg-slate-50'}`}>{req.character?.icon || '✨'}</div>
                        <div className="flex-1 w-full text-left">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h4 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">"{req.title}"</h4>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Author: {req.authorName}</p>
                            </div>
                            <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase self-start md:self-center tracking-widest ${req.status === 'ready' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{req.status}</span>
                          </div>
                          <p className="bg-slate-50 p-8 rounded-[35px] italic text-slate-700 mb-8 border border-slate-100 leading-relaxed text-lg font-serif">"{req.synopsis}"</p>
                          <div className="flex gap-4">
                            {req.status === 'pending' ? (
                              <button onClick={() => startDraftingBook(req)} className="bg-purple-600 text-white px-10 py-5 rounded-[25px] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-purple-700 transition-all flex items-center gap-2 hover:-translate-y-1"><Wand2 size={20} /> Draft & Edit</button>
                            ) : (
                              <button onClick={() => setEditingBook(req)} className="bg-slate-900 text-white px-10 py-5 rounded-[25px] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 hover:-translate-y-1"><Save size={20} /> Edit Published</button>
                            )}
                            {req.status === 'ready' && <button onClick={() => downloadPDF(req)} className="bg-slate-100 text-slate-500 px-6 py-5 rounded-[25px] hover:bg-slate-200 transition-all shadow-sm border border-slate-100"><Download size={24} /></button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[50px] border border-slate-100 p-12 shadow-sm animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {allAuthors.map(author => (<div key={author.id} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex items-center gap-5 transition-all hover:bg-purple-50 group shadow-sm"><div className="w-16 h-16 bg-purple-100 rounded-[25px] flex items-center justify-center text-purple-600 shadow-inner group-hover:scale-110 transition-transform"><User size={32} /></div><div className="text-left"><p className="font-black text-slate-900 text-lg uppercase tracking-tighter leading-none">{author.displayName}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">Joined {new Date(author.createdAt).toLocaleDateString()}</p></div></div>))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white py-16 border-t border-slate-50 mt-24">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-300">
          <p className="font-black text-xs uppercase tracking-[0.4em] mb-6">© 2024 Cryptid Creators • Meera's Studio</p>
          <span onClick={() => setView('admin-login')} className="hover:text-purple-600 cursor-pointer inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 px-6 py-3 rounded-full transition-all hover:bg-slate-50 active:scale-95"><Lock size={14} /> Meera's Door</span>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-in { animation: fade-in 0.5s ease-out; }
        .zoom-in { animation: zoom-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .shake { animation: shake 0.4s ease-in-out; }
        .font-serif { font-family: 'Times New Roman', Times, serif; }
      `}</style>
    </div>
  );
};

export default App;
