console.log("Vis.js loaded:", typeof vis !== 'undefined');
let tp3Tree = null;
let tp3Visualizer = null;

// Update ABR properties in the info panel
function updateABRProperties(tpNumber = 1) {
    const propsElement = document.querySelector(`.tp${tpNumber}-properties`);
    if (!propsElement) return;

    const height = bst && bst.root ? bst.getHeight() : 0;
    const degree = bst && bst.root ? bst.getDegree() : 0;

    propsElement.innerHTML = `
        <div>Type: <span class="tp${tpNumber}-prop-value">ABR</span></div>
        <div>Hauteur: <span class="tp${tpNumber}-prop-value">${height}</span></div>
        <div>Degré: <span class="tp${tpNumber}-prop-value">${degree}</span></div>
    `;
}

// Update AVL properties in the info panel
function updateAVLProperties(tpNumber = 1) {
    const propsElement = document.querySelector(`.tp${tpNumber}-properties`);
    if (!propsElement || !avl) return;

    const height = avl.root ? avl.getHeight() : 0;
    const degree = avl.root ? avl.getDegree() : 0;

    propsElement.innerHTML = `
        <div>Type: <span class="tp${tpNumber}-prop-value">AVL</span></div>
        <div>Hauteur: <span class="tp${tpNumber}-prop-value">${height}</span></div>
        <div>Degré: <span class="tp${tpNumber}-prop-value">${degree}</span></div>
    `;
}

// AVL Node class
class AVLNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

// AVL Tree class
class AVL {
    constructor() {
        this.root = null;
    }

    // Get height of node
    height(node) {
        return node === null ? 0 : node.height;
    }

    // Get balance factor
    getBalance(node) {
        return node === null ? 0 : this.height(node.left) - this.height(node.right);
    }

    // Update height of node
    updateHeight(node) {
        if (node !== null) {
            node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        }
    }

    // Right rotation
    rotateRight(z) {
        let y = z.left;
        let T2 = y.right;

        y.right = z;
        z.left = T2;

        this.updateHeight(z);
        this.updateHeight(y);

        return y;
    }

    // Left rotation
    rotateLeft(z) {
        let y = z.right;
        let T2 = y.left;

        y.left = z;
        z.right = T2;

        this.updateHeight(z);
        this.updateHeight(y);

        return y;
    }

    // Insert a value into the AVL tree
    insert(value) {
        this.root = this.insertNode(this.root, value);
    }

    // Find minimum value in a tree
    findMin(node = this.root) {
        while (node && node.left !== null) {
            node = node.left;
        }
        return node;
    }

    // Delete a node with the given value
    delete(value) {
        this.root = this.deleteNode(this.root, value);
        return this.root !== null;
    }

    deleteNode(node, value) {
        // Standard BST delete
        if (node === null) return null;

        if (value < node.value) {
            node.left = this.deleteNode(node.left, value);
        } else if (value > node.value) {
            node.right = this.deleteNode(node.right, value);
        } else {
            // Node with only one child or no child
            if (node.left === null || node.right === null) {
                const temp = node.left || node.right;

                // No child case
                if (temp === null) {
                    node = null;
                } else { // One child case
                    node = temp; // Copy the contents of the non-empty child
                }
            } else {
                // Node with two children: Get the inorder successor (smallest
                // in the right subtree)
                const temp = this.findMin(node.right);
                node.value = temp.value;
                node.right = this.deleteNode(node.right, temp.value);
            }
        }

        // If the tree had only one node then return
        if (node === null) return null;

        // Update height of the current node
        this.updateHeight(node);

        // Get the balance factor
        const balance = this.getBalance(node);

        // Left Left Case
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            return this.rotateRight(node);
        }

        // Left Right Case
        if (balance > 1 && this.getBalance(node.left) < 0) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        // Right Right Case
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            return this.rotateLeft(node);
        }

        // Right Left Case
        if (balance < -1 && this.getBalance(node.right) > 0) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    insertNode(node, value) {
        // 1. Normal BST insert
        if (node === null) {
            return new AVLNode(value);
        }

        if (value < node.value) {
            node.left = this.insertNode(node.left, value);
        } else if (value > node.value) {
            node.right = this.insertNode(node.right, value);
        } else {
            // Duplicate - don't insert
            return node;
        }

        // 2. Update height
        this.updateHeight(node);

        // 3. Get balance factor
        let balance = this.getBalance(node);

        // 4. Balance the tree if needed

        // Left-Left Case
        if (balance > 1 && value < node.left.value) {
            return this.rotateRight(node);
        }

        // Right-Right Case
        if (balance < -1 && value > node.right.value) {
            return this.rotateLeft(node);
        }

        // Left-Right Case
        if (balance > 1 && value > node.left.value) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        // Right-Left Case
        if (balance < -1 && value < node.right.value) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    // Search for a value in the AVL tree
    search(value, node = this.root) {
        if (node === null) return null;
        if (value === node.value) return node;
        if (value < node.value) return this.search(value, node.left);
        return this.search(value, node.right);
    }

    // Get tree height (for properties display)
    getHeight(node = this.root) {
        return this.height(node);
    }

    // Get max degree
    getDegree(node = this.root) {
        if (node === null) return 0;
        let childCount = 0;
        if (node.left !== null) childCount++;
        if (node.right !== null) childCount++;

        let maxDegree = childCount;
        if (node.left) maxDegree = Math.max(maxDegree, this.getDegree(node.left));
        if (node.right) maxDegree = Math.max(maxDegree, this.getDegree(node.right));

        return maxDegree;
    }
}

// Node class for BST
class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

// Binary Search Tree class
class BST {
    constructor() {
        this.root = null;
    }

    insert(value) {
        const newNode = new Node(value);

        if (this.root === null) {
            this.root = newNode;
            return true;
        } else {
            return this.insertNode(this.root, newNode);
        }
    }

    insertNode(node, newNode) {
        // Check for duplicate
        if (newNode.value === node.value) {
            return false; // Duplicate found
        }

        if (newNode.value < node.value) {
            if (node.left === null) {
                node.left = newNode;
                return true;
            } else {
                return this.insertNode(node.left, newNode);
            }
        } else {
            if (node.right === null) {
                node.right = newNode;
                return true;
            } else {
                return this.insertNode(node.right, newNode);
            }
        }
    }

    // Search for a value in the tree
    search(value, node = this.root) {
        if (node === null) return null;
        if (value === node.value) return node;
        if (value < node.value) return this.search(value, node.left);
        return this.search(value, node.right);
    }

    // Calculate height of the tree
    getHeight(node = this.root) {
        if (node === null) return 0;
        return 1 + Math.max(
            this.getHeight(node.left),
            this.getHeight(node.right)
        );
    }

    // Find minimum value in a tree
    findMin(node = this.root) {
        while (node && node.left !== null) {
            node = node.left;
        }
        return node;
    }

    // Delete a node with the given value
    delete(value) {
        this.root = this.deleteNode(this.root, value);
        return this.root !== null;
    }

    deleteNode(node, value) {
        if (node === null) return null;

        // Find the node to delete
        if (value < node.value) {
            node.left = this.deleteNode(node.left, value);
        } else if (value > node.value) {
            node.right = this.deleteNode(node.right, value);
        } else {
            // Node with only one child or no child
            if (node.left === null) {
                return node.right;
            } else if (node.right === null) {
                return node.left;
            }

            // Node with two children: Get the inorder successor (smallest
            // in the right subtree)
            const temp = this.findMin(node.right);
            node.value = temp.value;
            node.right = this.deleteNode(node.right, temp.value);
        }
        return node;
    }

    // Calculate degree of the tree (maximum number of children)
    getDegree(node = this.root) {
        if (node === null) return 0;
        let childCount = 0;
        if (node.left !== null) childCount++;
        if (node.right !== null) childCount++;

        let maxDegree = childCount;
        if (node.left) maxDegree = Math.max(maxDegree, this.getDegree(node.left));
        if (node.right) maxDegree = Math.max(maxDegree, this.getDegree(node.right));

        return maxDegree;
    }
}

// Visualize Binary Search Tree using vis.js
function visualizeTree(tree, containerId = 'treeNetwork') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
    }

    container.innerHTML = '';

    let nodesArray = [];
    let edgesArray = [];
    let nodePositions = {};

    // Update the global bst reference if a new tree is provided
    if (tree) {
        window.bst = tree;
    }

    // Calculate positions using in-order traversal for better layout
    let xCounter = 0;
    function calculatePositions(node) {
        if (node === null) return;
        calculatePositions(node.left);
        nodePositions[node.value] = { x: xCounter++ };
        calculatePositions(node.right);
    }

    calculatePositions(bst.root);

    function buildGraph(node, parentId = null, level = 0) {
        if (node === null) return;

        const nodeId = node.value;
        const xPos = nodePositions[node.value].x;

        nodesArray.push({
            id: nodeId,
            label: String(node.value),
            x: xPos * 120,
            y: level * 140,
            fixed: { x: true, y: true },
            color: {
                background: '#3b82f6',
                border: '#1e40af',
                highlight: { background: '#60a5fa', border: '#1e3a8a' },
                hover: { background: '#60a5fa', border: '#1e40af' }
            },
            font: {
                size: 16,
                color: '#ffffff',
                face: 'Arial',
                bold: "true"
            },
            shape: 'circle',
            size: 40,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.25)',
                size: 10,
                x: 3,
                y: 3
            },
            borderWidth: 3,
            borderWidthSelected: 5
        });

        if (parentId !== null) {
            edgesArray.push({
                from: parentId,
                to: nodeId,
                color: '#64748b',
                width: 3,
                smooth: false,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.1)',
                    size: 5,
                    x: 1,
                    y: 1
                }
            });
        }

        buildGraph(node.left, nodeId, level + 1);
        buildGraph(node.right, nodeId, level + 1);
    }

    buildGraph(bst.root);

    const data = {
        nodes: new vis.DataSet(nodesArray),
        edges: new vis.DataSet(edgesArray)
    };

    const options = {
        layout: {
            hierarchical: false
        },
        physics: {
            enabled: false
        },
        edges: {
            smooth: false,
            arrows: { to: { enabled: false } }
        },
        interaction: {
            dragNodes: false,
            dragView: true,
            zoomView: true,
            navigationButtons: false,
            keyboard: true
        },
        animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
        }
    };

    const network = new vis.Network(container, data, options);

    setTimeout(() => {
        network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }, 300);

    // Update properties after rendering
    if (bst && bst.root) {
        updateABRProperties();
    }

    // Store network reference for search/delete highlighting
    window.currentBSTNetwork = network;
    window.currentBSTNodes = data.nodes;
    window.currentBSTEdges = data.edges;
}

// Visualize AVL Tree using vis.js
function visualizeAVL(avlTree, containerId = 'treeNetwork') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
    }

    container.innerHTML = '';

    let nodesArray = [];
    let edgesArray = [];
    let nodePositions = {};

    // Calculate positions using in-order traversal
    let xCounter = 0;
    function calculatePositions(node) {
        if (node === null) return;
        calculatePositions(node.left);
        nodePositions[node.value] = { x: xCounter++ };
        calculatePositions(node.right);
    }

    calculatePositions(avlTree.root);

    function buildGraph(node, parentId = null, level = 0) {
        if (node === null) return;

        const nodeId = node.value;
        const xPos = nodePositions[node.value].x;

        nodesArray.push({
            id: nodeId,
            label: `${node.value}\nh:${node.height}`,
            x: xPos * 120,
            y: level * 140,
            fixed: { x: true, y: true },
            color: {
                background: '#10b981',
                border: '#047857',
                highlight: { background: '#6ee7b7', border: '#065f46' },
                hover: { background: '#6ee7b7', border: '#047857' }
            },
            font: {
                color: 'white',
                size: 13,
                bold: "true",
                face: 'Arial',
                multi: 'html'
            },
            shape: 'circle',
            size: 40,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.25)',
                size: 10,
                x: 3,
                y: 3
            },
            borderWidth: 3,
            borderWidthSelected: 5
        });

        if (parentId !== null) {
            edgesArray.push({
                from: parentId,
                to: nodeId,
                color: '#64748b',
                width: 3,
                smooth: false,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.1)',
                    size: 5,
                    x: 1,
                    y: 1
                }
            });
        }

        buildGraph(node.left, nodeId, level + 1);
        buildGraph(node.right, nodeId, level + 1);
    }

    buildGraph(avlTree.root);

    const data = {
        nodes: new vis.DataSet(nodesArray),
        edges: new vis.DataSet(edgesArray)
    };

    const options = {
        layout: {
            hierarchical: false
        },
        physics: {
            enabled: false
        },
        edges: {
            smooth: { type: 'straightCross' },
            arrows: { to: { enabled: false } }
        },
        interaction: {
            dragNodes: false,
            dragView: true,
            zoomView: true,
            navigationButtons: false,
            keyboard: true
        },
        animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
        }
    };

    const network = new vis.Network(container, data, options);

    setTimeout(() => {
        network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }, 300);

    // Store network reference for search/delete highlighting
    window.currentAVLNetwork = network;
    window.currentAVLNodes = data.nodes;
    window.currentAVLEdges = data.edges;
}

// ============================================
// TP3 - RED-BLACK TREE (INSERT + SEARCH + DELETE)
// ============================================

function initTP3Tree() {
    if (!tp3Tree) {
        tp3Tree = new RedBlackTreeTP3();
        tp3Visualizer = new TreeVisualizerTP3('tp3-treeNetwork', tp3Tree);
    }
}

// TP3 Insert Button
const tp3InsertBtn = document.getElementById('tp3-insert-btn');
if (tp3InsertBtn) {
    tp3InsertBtn.addEventListener('click', function () {
        if (!tp3Tree) initTP3Tree();

        const nodeValue = document.getElementById('tp3-node-value');
        const value = parseInt(nodeValue.value);

        if (isNaN(value)) {
            alert('Veuillez entrer une valeur numérique valide');
            return;
        }

        const steps = tp3Tree.insert(value);

        if (steps[steps.length - 1].type === 'error') {
            alert('Cette valeur existe déjà dans l\'arbre');
        } else {
            tp3Visualizer.render();
            updateTP3Properties();
        }

        nodeValue.value = '';
    });
}

// TP3 Bulk Insert Button
const tp3InsertBulkBtn = document.getElementById('tp3-insert-bulk-btn');
if (tp3InsertBulkBtn) {
    tp3InsertBulkBtn.addEventListener('click', function () {
        if (!tp3Tree) initTP3Tree(); // Ensure tp3Tree is initialized

        const bulkValues = document.getElementById('tp3-bulk-values');
        const valuesStr = bulkValues.value.trim();

        if (!valuesStr) {
            alert('Veuillez entrer des valeurs');
            return;
        }

        const values = valuesStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));

        if (values.length === 0) {
            alert('Aucune valeur valide trouvée');
            return;
        }

        values.forEach(value => {
            tp3Tree.insert(value); // Ensure tp3Tree is used correctly
        });

        tp3Visualizer.render();
        updateTP3Properties();
        bulkValues.value = '';
    });
}

// TP3 Search Button
const tp3SearchBtn = document.getElementById('tp3-search-btn');
if (tp3SearchBtn) {
    tp3SearchBtn.addEventListener('click', function () {
        if (!tp3Tree || tp3Tree.root === NIL) {
            alert('L\'arbre est vide. Veuillez d\'abord insérer des valeurs.');
            return;
        }

        const searchValue = document.getElementById('tp3-search-value');
        const value = parseInt(searchValue.value);

        if (isNaN(value)) {
            alert('Veuillez entrer une valeur numérique valide');
            return;
        }

        // Perform search
        const result = tp3Tree.search(value);

        // Display result
        const resultBox = document.getElementById('tp3-search-result');
        const resultMessage = document.getElementById('tp3-search-message');

        resultBox.style.display = 'block';

        if (result.found) {
            resultBox.style.background = '#d4edda';
            resultBox.style.border = '2px solid #28a745';
            resultMessage.innerHTML = `✓ Valeur <strong>${value}</strong> trouvée!<br>Chemin: ${result.path.join(' → ')}`;

            // Highlight the path in the tree
            tp3Visualizer.highlightNodes(result.path, '#28a745');

            // Reset highlighting after 3 seconds
            setTimeout(() => {
                tp3Visualizer.resetAllColors();
            }, 3000);
        } else {
            resultBox.style.background = '#f8d7da';
            resultBox.style.border = '2px solid #dc3545';
            resultMessage.innerHTML = `✗ Valeur <strong>${value}</strong> non trouvée.<br>Chemin parcouru: ${result.path.join(' → ')}`;

            // Highlight the path searched
            tp3Visualizer.highlightNodes(result.path, '#dc3545');

            setTimeout(() => {
                tp3Visualizer.resetAllColors();
            }, 3000);
        }

        searchValue.value = '';
    });
}

// TP3 Delete Button
const tp3DeleteBtn = document.getElementById('tp3-delete-btn');
if (tp3DeleteBtn) {
    tp3DeleteBtn.addEventListener('click', function () {
        if (!tp3Tree || tp3Tree.root === NIL) {
            alert('L\'arbre est vide. Rien à supprimer.');
            return;
        }

        const deleteValue = document.getElementById('tp3-delete-value');
        const value = parseInt(deleteValue.value);

        if (isNaN(value)) {
            alert('Veuillez entrer une valeur numérique valide');
            return;
        }

        // Perform deletion
        const success = tp3Tree.delete(value);

        if (success) {
            tp3Visualizer.render();
            updateTP3Properties();
            alert(`Valeur ${value} supprimée avec succès`);
        } else {
            alert(`Valeur ${value} non trouvée dans l'arbre`);
        }

        deleteValue.value = '';
    });
}

// TP3 Reset Button
const tp3ResetBtn = document.getElementById('tp3-reset-btn');
if (tp3ResetBtn) {
    tp3ResetBtn.addEventListener('click', function () {
        tp3Tree = new RedBlackTreeTP3();

        if (tp3Visualizer) {
            tp3Visualizer.clear();
        }

        tp3Visualizer = new TreeVisualizerTP3('tp3-treeNetwork', tp3Tree);
        updateTP3Properties();

        // Clear all inputs
        const nodeValue = document.getElementById('tp3-node-value');
        const bulkValues = document.getElementById('tp3-bulk-values');
        const searchValue = document.getElementById('tp3-search-value');
        const deleteValue = document.getElementById('tp3-delete-value');

        if (nodeValue) nodeValue.value = '';
        if (bulkValues) bulkValues.value = '';
        if (searchValue) searchValue.value = '';
        if (deleteValue) deleteValue.value = '';

        // Hide search result box
        const resultBox = document.getElementById('tp3-search-result');
        if (resultBox) resultBox.style.display = 'none';
    });
}

// TP3 Update Properties
function updateTP3Properties() {
    // If tp3Tree not initialized or empty, clear values
    if (!tp3Tree || tp3Tree.root === NIL) {
        const hEl = document.getElementById('tp3-hauteur');
        const nEl = document.getElementById('tp3-node-count');
        const bEl = document.getElementById('tp3-black-height');
        if (hEl) hEl.textContent = '0';
        if (nEl) nEl.textContent = '0';
        if (bEl) bEl.textContent = '0';
        return;
    }

    const height = tp3Tree.getHeight();
    const nodeCount = tp3Tree.countNodes();
    const blackHeight = tp3Tree.getBlackHeight();

    const hEl = document.getElementById('tp3-hauteur');
    const nEl = document.getElementById('tp3-node-count');
    const bEl = document.getElementById('tp3-black-height');
    if (hEl) hEl.textContent = String(height);
    if (nEl) nEl.textContent = String(nodeCount);
    if (bEl) bEl.textContent = String(blackHeight);
}
// TP4: QuickSort visualizer (adapted and corrected)
let tp4_nodes = [];
let tp4_edges = [];
let tp4_nodeId = 1;
let tp4_network = null;
let tp4_pivot_type = 'last'; // declared globally for clarity

// Deterministic selection: k-th smallest using median-of-medians (groups of 5)
function medianOfMedians(arr, k) {
    if (k < 0 || k >= arr.length) {
        throw new RangeError(`k out of range: k=${k}, length=${arr.length}`);
    }

    if (arr.length <= 5) {
        const tmp = arr.slice().sort((a, b) => a - b);
        return tmp[k]; // safe because we checked k above
    }

    // Step 1: split into groups of 5 and find each group median
    const medians = [];
    for (let i = 0; i < arr.length; i += 5) {
        const group = arr.slice(i, i + 5).sort((a, b) => a - b);
        medians.push(group[Math.floor(group.length / 2)]);
    }

    // Step 2: recursively find the median of medians
    const mm = medianOfMedians(medians, Math.floor(medians.length / 2));

    // Step 3: partition around mm
    const lows = [];
    const highs = [];
    const pivots = [];
    for (const x of arr) {
        if (x < mm) lows.push(x);
        else if (x > mm) highs.push(x);
        else pivots.push(x);
    }

    // Step 4: recurse into the correct side
    if (k < lows.length) return medianOfMedians(lows, k);
    if (k < lows.length + pivots.length) return mm;
    return medianOfMedians(highs, k - lows.length - pivots.length);
}

// Generic pivot chooser matching tp4_pivot_type
function tp4_choosePivot(arr, pivotType) {
    if (arr.length === 0) return null;
    switch (pivotType) {
        case 'last':
            return arr[arr.length - 1];
        case 'first':
            return arr[0];
        case 'random':
            return arr[Math.floor(Math.random() * arr.length)];
        case 'median':
            return medianOfMedians(arr, Math.floor(arr.length / 2));
        default:
            return arr[arr.length - 1];
    }
}

// Three-way partition quick sort (stable across pivot types, handles duplicates)
function tp4_quickSort(arr, pivotType = 'last') {
    if (arr.length <= 1) return arr.slice();

    const pivot = tp4_choosePivot(arr, pivotType);
    const left = [];
    const equal = [];
    const right = [];

    for (const v of arr) {
        if (v < pivot) left.push(v);
        else if (v > pivot) right.push(v);
        else equal.push(v);
    }

    const sortedLeft = tp4_quickSort(left, pivotType);
    const sortedRight = tp4_quickSort(right, pivotType);
    return [...sortedLeft, ...equal, ...sortedRight];
}

function tp4_measureSortTime(array, timingElId = 'tp4-timing', outputElId = 'tp4-sortedOutput', pivotType = 'last') {
    const start = performance.now();
    const sorted = tp4_quickSort(array, pivotType);
    const end = performance.now();
    const duration = Math.round(end - start);

    const timingEl = document.getElementById(timingElId);
    const outputEl = document.getElementById(outputElId);
    if (timingEl) timingEl.textContent = `Time taken: ${duration} ms`;
    if (outputEl) outputEl.textContent = `Sorted array: [${sorted.join(', ')}]`;
}

// build decomposition tree (top-down)
function tp4_buildDecompositionTree(arr, depth = 0, x = 0, pivotType = 'last') {
    const id = tp4_nodeId++;
    const pivot = tp4_choosePivot(arr, pivotType);

    const label = pivot !== null ? `[${arr.join(', ')}]   pivot = ${pivot}` : `[${arr.join(', ')}]`;
    const y = depth * 150;

    tp4_nodes.push({
        id,
        label,
        x,
        y,
        fixed: true,
        color: { background: 'lime', border: 'green' },
        shape: 'box'
    });

    if (arr.length <= 1) {
        return { type: 'leaf', nodeId: id, sorted: arr.slice(), x, depth };
    }

    // Three-way partition for accurate visualization
    const left = [];
    const equal = [];
    const right = [];
    for (const v of arr) {
        if (v < pivot) left.push(v);
        else if (v > pivot) right.push(v);
        else equal.push(v);
    }

    // Space children horizontally; keep pivot block as a single node
    const spacing = 300 / (depth + 1);
    const leftNode = tp4_buildDecompositionTree(left, depth + 1, x - spacing, pivotType);

    const pivotId = tp4_nodeId++;
    tp4_nodes.push({
        id: pivotId,
        label: `[${equal.join(', ')}]`,
        x,
        y: (depth + 1) * 150,
        fixed: true,
        color: { background: 'orange', border: 'darkorange' },
        shape: 'box'
    });

    const rightNode = tp4_buildDecompositionTree(right, depth + 1, x + spacing, pivotType);

    if (leftNode) tp4_edges.push({ from: id, to: leftNode.nodeId, label: `< (${pivot})` });
    tp4_edges.push({ from: id, to: pivotId, label: `= (${pivot})` });
    if (rightNode) tp4_edges.push({ from: id, to: rightNode.nodeId, label: `> (${pivot})` });

    return {
        type: 'branch',
        nodeId: id,
        pivotId,
        pivot,
        left: leftNode,
        right: rightNode,
        x,
        depth,
        sorted: null,
        equal // keep equal for recomposition clarity
    };
}

// build recomposition tree (bottom-up)
function tp4_buildRecompositionTree(node) {
    if (!node || node.sorted) return node;

    const leftSorted = tp4_buildRecompositionTree(node.left);
    const rightSorted = tp4_buildRecompositionTree(node.right);

    const recomposed = [
        ...(leftSorted?.sorted || []),
        ...(node.equal || [node.pivot]), // spread all equals; fallback to single pivot
        ...(rightSorted?.sorted || [])
    ];

    const recomposedId = tp4_nodeId++;
    const maxChildDepth = Math.max(leftSorted?.depth || 0, node.depth + 1, rightSorted?.depth || 0);
    const y = (maxChildDepth + 2) * 150;
    const x = node.x;

    tp4_nodes.push({
        id: recomposedId,
        label: `[${recomposed.join(', ')}]`,
        x,
        y,
        fixed: true,
        color: { background: '#d0f0ff', border: '#3399cc' },
        shape: 'box'
    });

    if (leftSorted) tp4_edges.push({ from: leftSorted.nodeId, to: recomposedId });
    if (node.pivotId) tp4_edges.push({ from: node.pivotId, to: recomposedId });
    if (rightSorted) tp4_edges.push({ from: rightSorted.nodeId, to: recomposedId });

    return { nodeId: recomposedId, sorted: recomposed, depth: maxChildDepth + 2, x };
}

// entry point wired to TP4 start button
function tp4_startSort() {
    tp4_nodes = [];
    tp4_edges = [];
    tp4_nodeId = 1;
    tp4_network = null;

    const inputEl = document.getElementById('tp4-array-input');
    const container = document.getElementById('tp4-network');
    if (!inputEl || !container) {
        console.warn('TP4 elements not found (ids: tp4-array-input / tp4-network)');
        return;
    }

    const input = inputEl.value || '';
    const array = input.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    if (array.length === 0) return alert('Please enter a valid array for TP4 (e.g. 20,4,11,1,19)');

    // read pivot type from UI
    const pivotSelect = document.getElementById('tp4-pivot-type');
    tp4_pivot_type = pivotSelect ? pivotSelect.value : 'last';

    tp4_measureSortTime(array, 'tp4-timing', 'tp4-sortedOutput', tp4_pivot_type);

    const root = tp4_buildDecompositionTree(array, 0, 0, tp4_pivot_type);
    tp4_buildRecompositionTree(root);

    const data = { nodes: new vis.DataSet(tp4_nodes), edges: new vis.DataSet(tp4_edges) };
    const options = {
        layout: { hierarchical: false },
        physics: { enabled: false },
        edges: { smooth: false },
        nodes: { shape: 'box' },
        interaction: { dragNodes: true, dragView: true, zoomView: true }
    };

    tp4_network = new vis.Network(container, data, options);
}

function tp4_reset() {
    const container = document.getElementById('tp4-network');
    if (container) container.innerHTML = '';
    const timing = document.getElementById('tp4-timing');
    const out = document.getElementById('tp4-sortedOutput');
    if (timing) timing.textContent = 'Time taken: -';
    if (out) out.textContent = 'Sorted array: -';
    const input = document.getElementById('tp4-array-input');
    if (input) input.value = '';
    tp4_nodes = [];
    tp4_edges = [];
    tp4_nodeId = 1;
    tp4_network = null;
}

// register TP4 buttons (safe to register in addition to existing DOM ready handler)
document.addEventListener('DOMContentLoaded', function () {
    const tp4Btn = document.getElementById('tp4-start-btn');
    const tp4ResetBtn = document.getElementById('tp4-reset-btn');
    if (tp4Btn) tp4Btn.addEventListener('click', tp4_startSort);
    if (tp4ResetBtn) tp4ResetBtn.addEventListener('click', tp4_reset);
}
);



let bst = new BST();
let avl = new AVL();

// TP2: Search in BST
function searchInBST(value) {
    if (!bst || !bst.root) return false;

    // Track search path
    const searchPath = [];
    let node = bst.root;
    let found = false;

    while (node) {
        searchPath.push(node.value);
        if (value === node.value) {
            found = true;
            break;
        } else if (value < node.value) {
            node = node.left;
        } else {
            node = node.right;
        }
    }

    // Highlight path in visualization
    if (window.currentBSTNodes) {
        const highlightColor = found ? '#22c55e' : '#ef4444';
        const borderColor = found ? '#16a34a' : '#dc2626';

        searchPath.forEach(nodeVal => {
            window.currentBSTNodes.update({
                id: nodeVal,
                color: {
                    background: highlightColor,
                    border: borderColor,
                    highlight: { background: highlightColor, border: borderColor }
                }
            });
        });

        // Reset colors after 2 seconds
        setTimeout(() => {
            searchPath.forEach(nodeVal => {
                window.currentBSTNodes.update({
                    id: nodeVal,
                    color: {
                        background: '#3b82f6',
                        border: '#1e40af',
                        highlight: { background: '#60a5fa', border: '#1e3a8a' }
                    }
                });
            });
        }, 2000);
    }

    return found;
}

// TP2: Search in AVL - Enhanced with animation
function searchInAVL(value) {
    if (!avl || !avl.root) return false;

    // Track search path
    const searchPath = [];
    let node = avl.root;
    let found = false;

    while (node) {
        searchPath.push(node.value);
        if (value === node.value) {
            found = true;
            break;
        } else if (value < node.value) {
            node = node.left;
        } else {
            node = node.right;
        }
    }

    // Highlight path in visualization
    if (window.currentAVLNodes) {
        const highlightColor = found ? '#22c55e' : '#ef4444';
        const borderColor = found ? '#16a34a' : '#dc2626';

        searchPath.forEach(nodeVal => {
            window.currentAVLNodes.update({
                id: nodeVal,
                color: {
                    background: highlightColor,
                    border: borderColor,
                    highlight: { background: highlightColor, border: borderColor }
                }
            });
        });

        // Reset colors after 2 seconds
        setTimeout(() => {
            searchPath.forEach(nodeVal => {
                window.currentAVLNodes.update({
                    id: nodeVal,
                    color: {
                        background: '#10b981',
                        border: '#047857',
                        highlight: { background: '#6ee7b7', border: '#065f46' }
                    }
                });
            });
        }, 2000);
    }

    return found;
}

// TP2: Delete from BST
function deleteFromBST(value) {
    if (!bst || !bst.root) return false;

    const success = bst.delete(value);

    if (success) {
        visualizeTree(bst, 'tp2-treeNetwork');
    }

    return success;
}

// TP2: Delete from AVL
function deleteFromAVL(value) {
    if (!avl || !avl.root) return false;

    const success = avl.delete(value);

    if (success) {
        visualizeAVL(avl, 'tp2-treeNetwork');
    }

    return success;
}

// TP2: Update TP2 properties display
function updateTP2Properties() {
    const type = document.getElementById('tp2-structure').value;
    const height = type === 'ABR' ?
        (bst && bst.root ? bst.getHeight() : 0) :
        (avl && avl.root ? avl.getHeight() : 0);

    const degree = type === 'ABR' ?
        (bst && bst.root ? bst.getDegree() : 0) :
        (avl && avl.root ? avl.getDegree() : 0);

    document.getElementById('tp2-type').textContent = type;
    document.getElementById('tp2-hauteur').textContent = height;
    document.getElementById('tp2-degree').textContent = degree;
}

// TP2: Show status message
function showStatus(message, type = 'info') {
    const status = document.getElementById('tp2-status');
    status.textContent = message;
    status.className = '';
    status.classList.add(type);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        status.className = '';
        status.textContent = '';
    }, 3000);
}

// TP2: Handle search button click
function handleSearch() {
    const searchInput = document.getElementById('tp2-search-input');
    const value = parseInt(searchInput.value);

    if (isNaN(value)) {
        showStatus('Veuillez entrer une valeur valide', 'error');
        return;
    }

    const type = document.getElementById('tp2-structure').value;
    let found = false;

    if (type === 'ABR') {
        found = searchInBST(value);
    } else {
        found = searchInAVL(value);
    }

    if (found) {
        showStatus(`La valeur ${value} a été trouvée dans l'arbre.`, 'success');
        // Highlight the found node (you can implement this)
    } else {
        showStatus(`La valeur ${value} n'a pas été trouvée dans l'arbre.`, 'error');
    }

    searchInput.value = '';
}

// TP2: Handle delete button click
function handleDelete() {
    const deleteInput = document.getElementById('tp2-delete-input');
    const value = parseInt(deleteInput.value);

    if (isNaN(value)) {
        showStatus('Veuillez entrer une valeur valide', 'error');
        return;
    }

    const type = document.getElementById('tp2-structure').value;
    let success = false;

    if (type === 'ABR') {
        success = deleteFromBST(value);
        if (success) {
            visualizeTree(bst);
        }
    } else {
        success = deleteFromAVL(value);
        if (success) {
            visualizeAVL(avl);
        }
    }

    if (success) {
        showStatus(`La valeur ${value} a été supprimée avec succès.`, 'success');
        updateTP2Properties();
    } else {
        showStatus(`La valeur ${value} n'a pas été trouvée.`, 'error');
    }

    deleteInput.value = '';
}

document.addEventListener('DOMContentLoaded', function () {
    // TP2 Elements
    const tp2Structure = document.getElementById('tp2-structure');
    const tp2ActionBtn = document.getElementById('tp2-action-btn');
    const tp2ResetBtn = document.getElementById('tp2-reset-btn');
    const tp2ValuesInput = document.getElementById('tp2-values');
    const tp2SearchBtn = document.getElementById('tp2-search-btn');
    const tp2DeleteBtn = document.getElementById('tp2-delete-btn');
    const tp2SearchSection = document.getElementById('tp2-search-section');
    const tp2DeleteSection = document.getElementById('tp2-delete-section');

    // TP2: Show search/delete sections after tree is built
    function showTP2Sections() {
        tp2SearchSection.style.display = 'block';
        tp2DeleteSection.style.display = 'block';
    }

    // TP2: Reset TP2 visualization
    function resetTP2Visualization() {
        if (tp2Structure.value === 'ABR') {
            bst = new BST();
        } else {
            avl = new AVL();
        }

        const container = document.getElementById('tp2-treeNetwork');
        container.innerHTML = '';

        tp2SearchSection.style.display = 'none';
        tp2DeleteSection.style.display = 'none';
        document.getElementById('tp2-status').textContent = '';
        updateTP2Properties();
    }

    // TP2: Handle build button click
    function handleTP2Build() {
        const values = tp2ValuesInput.value
            .split(',')
            .map(v => parseInt(v.trim()))
            .filter(v => !isNaN(v));

        if (values.length === 0) {
            showStatus('Veuillez entrer des valeurs valides', 'error');
            return;
        }

        const type = tp2Structure.value;

        if (type === 'ABR') {
            bst = new BST();
            values.forEach(value => {
                bst.insert(value);
            });
            visualizeTree(bst, 'tp2-treeNetwork');
        } else {
            avl = new AVL();
            values.forEach(value => {
                avl.insert(value);
            });
            visualizeAVL(avl, 'tp2-treeNetwork');
        }

        showTP2Sections();
        updateTP2Properties();
        showStatus('Arbre construit avec succès!', 'success');
    }

    // TP2: Initialize event listeners
    if (tp2ActionBtn) {
        tp2ActionBtn.addEventListener('click', handleTP2Build);
    }

    if (tp2ResetBtn) {
        tp2ResetBtn.addEventListener('click', resetTP2Visualization);
    }

    if (tp2SearchBtn) {
        tp2SearchBtn.addEventListener('click', handleSearch);
    }

    if (tp2DeleteBtn) {
        tp2DeleteBtn.addEventListener('click', handleDelete);
    }
    // Navigation and menu handling
    const menuItems = document.querySelectorAll('.menu-item');
    const tpContents = [
        document.getElementById('tp1-content'),
        document.getElementById('tp2-content'),
        document.getElementById('tp3-content'),
        document.getElementById('tp4-content'),
        document.getElementById('tp5-content')
    ];
    const landing = document.getElementById('landing-content');
    const landingBtn = document.getElementById('landing-btn');
    let currentIdx = null;

    // TP1 Elements
    const tp1Structure = document.getElementById('tp1-structure');
    const tp1Canvas = document.querySelector('.tp1-canvas');
    const tp1Reset = document.querySelector('.tp1-reset');
    const tp1Input = document.getElementById('tp1-node');
    const actionBtn = document.getElementById('action-btn');
    const tp1Props = document.querySelector('.tp1-properties');
    const treeOptions = document.getElementById('tree-options');
    const graphOptions = document.getElementById('graph-options');
    const nodeCountInput = document.getElementById('node-count');
    const abrValuesInput = document.getElementById('abr-values');



    // Initialize UI state
    function initUI() {
        // Hide all TP sections and show only landing at start
        menuItems.forEach(item => item.classList.remove('active'));
        tpContents.forEach(tp => tp.classList.remove('visible', 'fade-in', 'fade-out'));
        landing.classList.add('visible');

        // Set up structure change handler
        if (tp1Structure) {
            handleStructureChange();
            tp1Structure.addEventListener('change', handleStructureChange);
        }

        // Set up action button
        if (actionBtn) {
            actionBtn.addEventListener('click', handleAction);
        }

        // Set up reset button
        if (tp1Reset) {
            tp1Reset.addEventListener('click', (e) => {
                e.preventDefault();
                resetVisualization(1);
            });
        }
    }

    // Handle structure type change
    function handleStructureChange() {
        const selectedValue = tp1Structure.value;
        const isGraph = selectedValue === 'Graphe';
        const isABR = selectedValue === 'ABR';
        const isAVL = selectedValue === 'AVL';

        // Toggle between tree and graph options
        treeOptions.style.display = isGraph ? 'none' : 'block';
        graphOptions.style.display = isGraph ? 'block' : 'none';

        // Toggle between different tree options
        const abrOptions = document.getElementById('abr-options');
        const avlOptions = document.getElementById('avl-options');
        const otherTreeOptions = document.getElementById('other-tree-options');

        abrOptions.style.display = isABR ? 'block' : 'none';
        avlOptions.style.display = isAVL ? 'block' : 'none';
        otherTreeOptions.style.display = (!isABR && !isAVL && !isGraph) ? 'block' : 'none';

        // Update button text
        if (actionBtn) {
            if (isGraph) {
                actionBtn.textContent = 'Générer Graphe';
            } else if (isABR) {
                actionBtn.textContent = 'Construire ABR';
            } else if (isAVL) {
                actionBtn.textContent = 'Construire AVL';
            } else {
                actionBtn.textContent = 'Ajouter Noeud';
            }
        }

        updateCanvasAndProps(selectedValue);
    }

    // Handle action button click (Add Node, Build ABR, Build AVL, or Generate Graph)
    function handleAction() {
        const selectedValue = tp1Structure.value;

        if (selectedValue === 'Graphe') {
            // Handle graph generation
            const nodeCount = nodeCountInput ? parseInt(nodeCountInput.value) : 5;
            const graphType = document.querySelector('input[name="graph-type"]:checked').value;
            const weightType = document.querySelector('input[name="graph-weight"]:checked').value;

            // Validate node count
            if (nodeCount < 2 || nodeCount > 15) {
                alert('Le nombre de nœuds doit être entre 2 et 15');
                return;
            }

            // Generate graph visualization
            generateGraph(nodeCount, graphType, weightType);
        } else if (selectedValue === 'ABR' || selectedValue === 'AVL') {
            // Get the appropriate input element based on tree type
            const inputElement = selectedValue === 'ABR' ?
                document.getElementById('abr-values') :
                document.getElementById('avl-values');

            const values = inputElement.value
                .split(',')
                .map(val => val.trim())
                .filter(val => val !== '')
                .map(Number);

            // Validate input
            if (values.length === 0 || values.some(isNaN)) {
                alert('Veuillez entrer des valeurs numériques valides séparées par des virgules');
                return;
            }

            if (selectedValue === 'ABR') {
                // Handle ABR construction
                bst = new BST();
                const duplicates = [];

                values.forEach(value => {
                    if (!bst.insert(value)) {
                        duplicates.push(value);
                    }
                });

                console.log('ABR construit:', bst);

                // Show message if duplicates were found
                if (duplicates.length > 0) {
                    alert(`Valeurs dupliquées ignorées: ${duplicates.join(', ')}`);
                }

                // Visualize the BST
                visualizeTree(bst);
                updateABRProperties();
            } else { // AVL
                // Handle AVL construction
                avl = new AVL();

                values.forEach(value => {
                    avl.insert(value);
                });

                console.log('AVL construit:', avl);

                // Visualize the AVL tree
                visualizeAVL(avl);
                updateAVLProperties();
            }
        } else {
            // Handle other tree node addition
            const nodeValue = tp1Input ? tp1Input.value.trim() : '';

            if (!nodeValue) {
                alert('Veuillez entrer une valeur pour le nœud');
                return;
            }

            // Add node to the tree visualization
            addTreeNode(nodeValue, selectedValue);
        }
    }

    // Generate graph visualization
    function generateGraph(nodeCount, graphType, weightType, tpNumber = 1) {
        if (!tp1Canvas) return;

        // 1. Clear previous content
        tp1Canvas.innerHTML = '';

        // 2. Create the container
        // CRITICAL: vis.js requires a specific height to be visible
        const networkContainer = document.createElement('div');
        networkContainer.id = 'vis-network';
        networkContainer.style.width = '100%';
        networkContainer.style.height = '600px'; // Give it height!
        networkContainer.style.border = '1px solid #e0e0e0';
        networkContainer.style.borderRadius = '8px';
        networkContainer.style.background = '#ffffff';

        tp1Canvas.appendChild(networkContainer);

        // 3. Determine Graph Options based on inputs
        // We normalize the strings to lowercase to handle inputs like "Orienté", "orienté", "oriente", etc.
        const isOriented = graphType.toLowerCase().includes('orient') && !graphType.toLowerCase().includes('non');
        const isWeighted = weightType.toLowerCase().includes('pond') && !weightType.toLowerCase().includes('non');

        // 4. Generate Nodes
        const nodesArray = [];
        for (let i = 1; i <= nodeCount; i++) {
            nodesArray.push({
                id: i,
                label: String(i), // Label is just the number
                color: { background: '#D2E5FF', border: '#2B7CE9' }
            });
        }

        // 5. Generate Edges
        const edgesArray = [];

        // Create random connections for demonstration
        for (let i = 1; i <= nodeCount; i++) {
            // Connect this node to 1 or 2 random other nodes
            const connections = Math.floor(Math.random() * 2) + 1;

            for (let k = 0; k < connections; k++) {
                const target = Math.floor(Math.random() * nodeCount) + 1;

                // Prevent self-loops for cleaner graph (optional)
                if (target !== i) {
                    // Check if edge already exists to avoid duplicates
                    const exists = edgesArray.some(e =>
                        (e.from === i && e.to === target) ||
                        (!isOriented && e.from === target && e.to === i)
                    );

                    if (!exists) {
                        let edge = { from: i, to: target };

                        // OPTION: Directed (Orienté)
                        if (isOriented) {
                            edge.arrows = 'to'; // Adds the arrow
                        }

                        // OPTION: Weighted (Pondéré)
                        if (isWeighted) {
                            const weight = Math.floor(Math.random() * 20) + 1; // Random weight 1-20
                            edge.label = String(weight); // Show weight on the line
                            edge.font = { align: 'horizontal', size: 12, background: 'white' };
                        }

                        edgesArray.push(edge);
                    }
                }
            }
        }

        // 6. Initialize Vis.js
        const data = {
            nodes: new vis.DataSet(nodesArray),
            edges: new vis.DataSet(edgesArray)
        };

        const options = {
            physics: {
                enabled: true,
                stabilization: false,
                barnesHut: {
                    gravitationalConstant: -2000,
                    springConstant: 0.04,
                    springLength: 95
                }
            },
            interaction: {
                dragNodes: true,
                zoomView: true
            }
        };

        // Create the network
        const network = new vis.Network(networkContainer, data, options);

        // Update external properties if needed
        if (typeof updateGraphProperties === 'function') {
            updateGraphProperties(nodeCount, graphType, weightType, tpNumber);
        }
    }

    // Add node to tree visualization
    function addTreeNode(value, treeType, tpNumber = 1) {
        const canvasId = tpNumber === 1 ? 'treeNetwork' : 'tp2-treeNetwork';
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // For now, just show a simple message
        // In a real implementation, this would update the tree visualization
        canvas.textContent = `Ajout du nœud ${value} à l'arbre de type ${treeType}`;

        // Update properties
        updateTreeProperties(treeType, tpNumber);
    }

    // Update graph properties in the info panel
    function updateGraphProperties(nodeCount, graphType, weightType, tpNumber = 1) {
        const propsElement = document.querySelector(`.tp${tpNumber}-properties`);
        if (!propsElement) return;

        // Simulate some properties
        const density = (Math.random() * 0.8 + 0.1).toFixed(2);
        const avgDegree = (nodeCount * 0.7).toFixed(1);

        propsElement.innerHTML = `
            <div>Nombre de nœuds: <span class="tp${tpNumber}-prop-value">${nodeCount}</span></div>
            <div>Type: <span class="tp${tpNumber}-prop-value">${graphType}</span></div>
            <div>Poids: <span class="tp${tpNumber}-prop-value">${weightType}</span></div>
            <div>Degré moyen: <span class="tp${tpNumber}-prop-value">${avgDegree}</span></div>
            <div>Densité: <span class="tp${tpNumber}-prop-value">${density}</span></div>
        `;
    }

    // Update tree properties in the info panel
    function updateTreeProperties(treeType, tpNumber = 1) {
        const propsElement = document.querySelector(`.tp${tpNumber}-properties`);
        if (!propsElement) return;

        // Don't update for ABR/AVL, use updateABRProperties/updateAVLProperties instead
        if (treeType === 'ABR') {
            updateABRProperties(tpNumber);
            return;
        }
        if (treeType === 'AVL') {
            updateAVLProperties(tpNumber);
            return;
        }

        // Simulate some properties for other tree types
        const height = Math.floor(Math.random() * 5 + 2);
        const nodeCount = Math.floor(Math.random() * 10 + 1);

        propsElement.innerHTML = `
            <div>Type: <span class="tp${tpNumber}-prop-value">${treeType}</span></div>
            <div>Hauteur: <span class="tp${tpNumber}-prop-value">${height}</span></div>
            <div>Nombre de nœuds: <span class="tp${tpNumber}-prop-value">${nodeCount}</span></div>
        `;
    }

    // Reset visualization
    function resetVisualization(tpNumber = 1) {
        const canvasId = tpNumber === 1 ? 'treeNetwork' : 'tp2-treeNetwork';
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.textContent = 'Prêt à construire';
            canvas.style.padding = '0';
        }

        const input = document.getElementById(tpNumber === 1 ? 'tp1-node' : 'tp2-node');
        if (input) input.value = '';

        // Reset properties panel
        const propsElement = document.querySelector(`.tp${tpNumber}-properties`);
        if (propsElement) {
            propsElement.innerHTML = `
                <div>Type: <span class="tp${tpNumber}-prop-value">-</span></div>
                <div>Hauteur: <span class="tp${tpNumber}-prop-value">-</span></div>
                <div>Degré: <span class="tp${tpNumber}-prop-value">-</span></div>
                <div>Densité: <span class="tp${tpNumber}-prop-value">-</span></div>
            `;
        }
    }

    // Update canvas and properties based on selected structure
    function updateCanvasAndProps(type, tpNumber = 1) {
        const canvasId = tpNumber === 1 ? 'treeNetwork' : 'tp2-treeNetwork';
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Clear previous content
        canvas.textContent = type ? `Structure sélectionnée: ${type}` : 'Prêt à construire';
        canvas.style.padding = '20px';

        // Reset properties panel
        resetVisualization(tpNumber);
    }

    // Initialize the UI
    initUI();

    // Menu item click handler
    menuItems.forEach((item, idx) => {
        item.addEventListener('click', function (e) {
            // Ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = this.getBoundingClientRect();
            ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
            ripple.style.left = (e.clientX - rect.left - rect.width / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - rect.height / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 500);

            // Active switching
            document.querySelector('.menu-item.active')?.classList.remove('active');
            this.classList.add('active');

            // Always hide all TP sections before showing the new one
            tpContents.forEach(tp => tp.classList.remove('visible', 'fade-in', 'fade-out'));

            // If landing page is visible, fade it out and show the selected TP
            if (currentIdx === null) {
                landing.classList.remove('visible');
                landing.classList.add('fade-out');
                setTimeout(() => {
                    landing.classList.remove('fade-out');
                    tpContents[idx].classList.add('visible', 'fade-in');
                    setTimeout(() => {
                        tpContents[idx].classList.remove('fade-in');
                    }, 300);
                }, 300);
                currentIdx = idx;
            } else if (idx !== currentIdx) {
                // Fade out current TP, fade in new TP
                const prev = tpContents[currentIdx];
                prev.classList.remove('visible');
                prev.classList.add('fade-out');
                setTimeout(() => {
                    prev.classList.remove('fade-out');
                    tpContents[idx].classList.add('visible', 'fade-in');
                    setTimeout(() => {
                        tpContents[idx].classList.remove('fade-in');
                    }, 300);
                }, 300);
                currentIdx = idx;
            }
        });
    });

    // Landing button click handler
    if (landingBtn) {
        landingBtn.addEventListener('click', function () {
            // Remove active from all menu items
            document.querySelectorAll('.menu-item.active').forEach(btn => btn.classList.remove('active'));
            // Fade out current TP if any
            if (currentIdx !== null) {
                const prev = tpContents[currentIdx];
                prev.classList.remove('visible');
                prev.classList.add('fade-out');
                setTimeout(() => {
                    prev.classList.remove('fade-out');
                    landing.classList.add('visible', 'fade-in');
                    setTimeout(() => {
                        landing.classList.remove('fade-in');
                    }, 300);
                }, 300);
                currentIdx = null;
            }
        });
    }
});
document.getElementById('tp4-gen-btn').addEventListener('click', function () {
    const defaultArray = "20,4,11,1,19,22,15";
    const inputArea = document.getElementById('tp4-array-input');

    // Set the value of the textarea
    inputArea.value = defaultArray;
});


document.getElementById('tp2-gen-btn').addEventListener('click', function () {
    // A sequence of values chosen to demonstrate basic ABR insertion and force
    // different types of rotations when the AVL structure is selected (LL, RR, LR, RL).
    const defaultValues = "30, 15, 45, 10, 20, 40, 50, 5, 25, 42";
    const inputArea = document.getElementById('tp2-values');

    // Set the value of the bulk input field
    inputArea.value = defaultValues;

    // Optional: Clear the single node value input
    document.getElementById('tp2-node').value = '';
});

document.getElementById('tp1-gen-btn').addEventListener('click', function () {
    // A sequence of values chosen to demonstrate ABR structure and force AVL rotations.
    const defaultValues = "30, 15, 45, 10, 20, 40, 50, 5, 25, 42";

    // Fill the ABR input field
    const abrInput = document.getElementById('abr-values');
    if (abrInput) {
        abrInput.value = defaultValues;
    }

    // Fill the AVL input field
    const avlInput = document.getElementById('avl-values');
    if (avlInput) {
        avlInput.value = defaultValues;
    }

    // Optional: Clear any single node input if it exists and is for tree structures
    const singleNodeInput = document.getElementById('tp1-node');
    if (singleNodeInput) {
        singleNodeInput.value = '';
    }
});