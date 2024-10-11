let documents = [];
let currentDraft = {};
let deleteMode = false;
let currentEditIndex = -1;
const API_URL = window.API_URL || '/api';

// Fetch all documents
async function fetchDocuments() {
    try {
        const response = await fetch(`${API_URL}/documents`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        documents = await response.json();
        updateDocumentList();
    } catch (error) {
        console.error('Error fetching documents:', error);
        showError('Failed to load documents. Please try again.');
    }
}

// Create a new document
async function createDocument() {
    const topic = document.getElementById('topicInput').value;
    const writer = document.getElementById('writerInput').value;
    const content = document.getElementById('contentInput').value;

    if (topic && writer && content) {
        try {
            const response = await fetch(`${API_URL}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic, writer, content }),
            });
            if (!response.ok) {
                throw new Error('Failed to create document');
            }
            const newDocument = await response.json();
            documents.push(newDocument);
            updateDocumentList();
            clearInputs();
            showPage('documentListPage');
        } catch (error) {
            console.error('Error creating document:', error);
            showError('Failed to create document. Please try again.');
        }
    } else {
        showError('Please fill in all fields');
    }
}

// Update an existing document
async function saveEdit() {
    const editedDoc = {
        topic: document.getElementById('editTitle').value,
        writer: document.getElementById('editWriter').value,
        content: document.getElementById('editContent').value
    };

    if (editedDoc.topic && editedDoc.writer && editedDoc.content) {
        try {
            const response = await fetch(`${API_URL}/documents/${documents[currentEditIndex]._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedDoc),
            });
            if (!response.ok) {
                throw new Error('Failed to update document');
            }
            const updatedDocument = await response.json();
            documents[currentEditIndex] = updatedDocument;
            viewDocument(currentEditIndex);
            updateDocumentList();
            showPage('documentListPage');
        } catch (error) {
            console.error('Error updating document:', error);
            showError('Failed to update document. Please try again.');
        }
    } else {
        showError('Please fill in all fields');
    }
}

// Delete selected documents
async function deleteSelectedDocuments() {
    const selectedDocs = getSelectedDocuments();
    if (selectedDocs.length > 0) {
        try {
            for (const doc of selectedDocs) {
                const response = await fetch(`${API_URL}/documents/${doc._id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error('Failed to delete document');
                }
            }
            documents = documents.filter(doc => !selectedDocs.includes(doc));
            updateDocumentList();
            showPage('documentListPage');
        } catch (error) {
            console.error('Error deleting documents:', error);
            showError('Failed to delete documents. Please try again.');
        }
    } else {
        showError('No documents selected');
    }
}

// Helper function to show errors
function showError(message) {
    alert(message);  // For now, we'll use alert. In a production app, you'd want a more user-friendly error display.
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    const newPage = document.getElementById(pageId);
    newPage.classList.add('active');
    newPage.style.display = 'block';
    newPage.style.animation = 'none';
    newPage.offsetHeight; // Trigger reflow
    newPage.style.animation = null;
    
    if (pageId === 'createDocumentPage') {
        loadDraft();
    }
    if (pageId === 'documentListPage') {
        exitDeleteMode();
    }
}

function updateDocumentList(docs = documents) {
    const list = document.getElementById('documentList');
    list.innerHTML = '';
    docs.forEach((doc, index) => {
        const item = document.createElement('div');
        item.className = 'document-item';
        item.innerHTML = `
            <input type="checkbox" data-index="${index}">
            <div>
                <div class="document-title">${doc.topic}</div>
                <div class="document-meta">By ${doc.writer}</div>
            </div>
            <div class="document-actions">
                <button onclick="viewDocument(${index})" class="icon-button view-button" title="View"><i class="fas fa-eye"></i></button>
                <button onclick="editDocument(${index})" class="icon-button edit-button" title="Edit"><i class="fas fa-edit"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
}

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    const deleteButtonGroup = document.getElementById('deleteButtonGroup');
    const toggleDeleteBtn = document.getElementById('toggleDeleteBtn');
    const documentListPage = document.getElementById('documentListPage');

    if (deleteMode) {
        deleteButtonGroup.classList.add('active');
        toggleDeleteBtn.style.display = 'none';
        documentListPage.classList.add('delete-mode');
    } else {
        deleteButtonGroup.classList.remove('active');
        toggleDeleteBtn.style.display = 'inline-block';
        documentListPage.classList.remove('delete-mode');
        // Uncheck all checkboxes when exiting delete mode
        document.querySelectorAll('.document-item input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
}

function exitDeleteMode() {
    if (deleteMode) {
        toggleDeleteMode();
    }
}

function getSelectedDocuments() {
    const checkboxes = document.querySelectorAll('.document-item input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => documents[parseInt(cb.getAttribute('data-index'))]);
}

function viewDocument(index) {
    const doc = documents[index];
    currentEditIndex = index;
    document.getElementById('docTitle').textContent = doc.topic;
    document.getElementById('docWriter').textContent = doc.writer;
    document.getElementById('docContent').textContent = doc.content;
    document.getElementById('editTitle').value = doc.topic;
    document.getElementById('editWriter').value = doc.writer;
    document.getElementById('editContent').value = doc.content;
    showPage('viewDocumentPage');
    setViewMode();
}

function editDocument(index) {
    viewDocument(index);
    toggleEditMode();
}

function clearInputs() {
    document.getElementById('topicInput').value = '';
    document.getElementById('writerInput').value = '';
    document.getElementById('contentInput').value = '';
}

function handleBack() {
    const topic = document.getElementById('topicInput').value;
    const writer = document.getElementById('writerInput').value;
    const content = document.getElementById('contentInput').value;

    if (topic || writer || content) {
        const saveDraft = confirm("Do you want to save your draft before going back?");
        if (saveDraft) {
            currentDraft = { topic, writer, content };
            alert("Draft saved. You can continue editing it later.");
        } else {
            currentDraft = {};
        }
    }
    showPage('documentListPage');
}

function loadDraft() {
    if (currentDraft.topic || currentDraft.writer || currentDraft.content) {
        document.getElementById('topicInput').value = currentDraft.topic || '';
        document.getElementById('writerInput').value = currentDraft.writer || '';
        document.getElementById('contentInput').value = currentDraft.content || '';
    }
}

function toggleEditMode() {
    const viewDocumentPage = document.getElementById('viewDocumentPage');
    const editBtn = document.querySelector('.edit-btn');
    const saveBtn = document.querySelector('.save-btn');
    
    if (viewDocumentPage.classList.contains('view-mode')) {
        viewDocumentPage.classList.remove('view-mode');
        viewDocumentPage.classList.add('edit-mode');
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
    } else {
        setViewMode();
    }
}

function setViewMode() {
    const viewDocumentPage = document.getElementById('viewDocumentPage');
    const editBtn = document.querySelector('.edit-btn');
    const saveBtn = document.querySelector('.save-btn');
    
    viewDocumentPage.classList.remove('edit-mode');
    viewDocumentPage.classList.add('view-mode');
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';

    // Update the view-only elements with the edited content
    document.getElementById('docTitle').textContent = document.getElementById('editTitle').value;
    document.getElementById('docWriter').textContent = document.getElementById('editWriter').value;
    document.getElementById('docContent').textContent = document.getElementById('editContent').value;
}

function downloadDocument() {
    const doc = documents[currentEditIndex];
    const content = `Topic: ${doc.topic}\nWriter: ${doc.writer}\n\n${doc.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize the document list
document.addEventListener('DOMContentLoaded', fetchDocuments);

// Add search functionality
document.querySelector('.search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredDocuments = documents.filter(doc => 
        doc.topic.toLowerCase().includes(searchTerm) || 
        doc.writer.toLowerCase().includes(searchTerm) || 
        doc.content.toLowerCase().includes(searchTerm)
    );
    updateDocumentList(filteredDocuments);
});