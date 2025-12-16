let network = null;
let nodes, edges;
const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Initialize empty network
function initNetwork() {
    const container = document.getElementById('tp5-network');
    nodes = new vis.DataSet([]);
    edges = new vis.DataSet([]);
    const data = { nodes, edges };
    const options = {
        nodes: {
            shape: 'circle',
            size: 25,
            font: { size: 16, color: '#fff', face: 'Arial', bold: true },
            borderWidth: 3,
            borderWidthSelected: 4
        },
        edges: {
            width: 2,
            color: { color: '#94a3b8', highlight: '#475569' }
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -8000,
                springConstant: 0.04,
                springLength: 150
            },
            stabilization: { iterations: 200 }
        }
    };
    network = new vis.Network(container, data, options);
}

// Parse adjacency matrix
function parseMatrix(input) {
    const rows = input.trim().split('\n').filter(r => r.trim());
    const matrix = rows.map(row =>
        row.split(',').map(val => parseInt(val.trim()))
    );

    if (matrix.length === 0) throw new Error('Empty matrix');
    const n = matrix.length;
    if (!matrix.every(row => row.length === n)) {
        throw new Error('Matrix must be square');
    }

    return matrix;
}

//parse bellmand-ford matrix 
function parseWeightedMatrix(bellmanMatrix) {
    const rows = bellmanMatrix.trim().split('\n').filter(r => r.trim());

    const bellmatrix = rows.map(row =>
        row
            .trim()
            .split(/[\s,]+/)     // space OR comma
            .map(val => {
                const num = Number(val);
                if (isNaN(num)) {
                    throw new Error("Invalid number in matrix");
                }
                return num;
            })
    );

    if (bellmatrix.length === 0) {  // ✅ CORRECT - check parsed matrix
        throw new Error("Empty matrix");
    }

    const n = bellmatrix.length;
    if (!bellmatrix.every(row => row.length === n)) {
        throw new Error("Matrix must be square");
    }

    return bellmatrix;
}

//create bellmand graph from matrix
function createDirectedGraphFromWeightedMatrix(bellmatrix) {
    const n = bellmatrix.length;
    nodes.clear();
    edges.clear();

    for (let i = 0; i < n; i++) {
        nodes.add({
            id: i,
            label: `${i}`,
            color: { background: '#94a3b8', border: '#64748b' }
        });
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (bellmatrix[i][j] !== 0) {  // Changed from bellmanMatrix
                edges.add({
                    from: i,
                    to: j,
                    label: String(bellmatrix[i][j]),  // Changed from bellmanMatrix
                    arrows: 'to'
                });
            }
        }
    }
}



// Create graph from matrix
function createGraphFromMatrix(matrix) {
    const n = matrix.length;
    nodes.clear();
    edges.clear();

    for (let i = 0; i < n; i++) {
        nodes.add({
            id: i,
            label: `${i}`,
            color: { background: '#94a3b8', border: '#64748b' }
        });
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matrix[i][j] !== 0) {  // Changed from bellmanMatrix
                edges.add({
                    from: i,
                    to: j,
                    label: String(matrix[i][j]),  // Changed from bellmanMatrix
                    arrows: 'to'
                });
            }
        }
    }
}

// Get degree of a vertex
function getDegree(vertex, matrix, availableVertices) {
    let degree = 0;
    for (let v of availableVertices) {
        if (matrix[vertex][v] === 1) degree++;
    }
    return degree;
}

// RLF Algorithm with visualization
async function rlfAlgorithm(matrix) {
    const n = matrix.length;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const vertexColors = new Array(n).fill(-1);
    let uncoloredVertices = new Set([...Array(n).keys()]);
    let colorClass = 0;
    const colorAssignments = [];

    updateInfo('Starting RLF algorithm...');

    while (uncoloredVertices.size > 0) {
        const currentColorVertices = [];
        const available = new Set(uncoloredVertices);

        // Find vertex with largest degree
        let maxDegree = -1;
        let selectedVertex = -1;
        for (let v of available) {
            const degree = getDegree(v, matrix, available);
            if (degree > maxDegree) {
                maxDegree = degree;
                selectedVertex = v;
            }
        }

        // Color the selected vertex
        vertexColors[selectedVertex] = colorClass;
        currentColorVertices.push(selectedVertex);
        uncoloredVertices.delete(selectedVertex);

        // Remove neighbors from available set
        const forbidden = new Set();
        for (let i = 0; i < n; i++) {
            if (matrix[selectedVertex][i] === 1) {
                forbidden.add(i);
            }
        }

        // Find more vertices to color with same color
        while (true) {
            let nextVertex = -1;
            maxDegree = -1;

            for (let v of uncoloredVertices) {
                if (!forbidden.has(v)) {
                    const degree = getDegree(v, matrix, forbidden);
                    if (degree > maxDegree) {
                        maxDegree = degree;
                        nextVertex = v;
                    }
                }
            }

            if (nextVertex === -1) break;

            vertexColors[nextVertex] = colorClass;
            currentColorVertices.push(nextVertex);
            uncoloredVertices.delete(nextVertex);

            // Update forbidden set
            for (let i = 0; i < n; i++) {
                if (matrix[nextVertex][i] === 1) {
                    forbidden.add(i);
                }
            }
        }

        colorAssignments.push({
            color: colorClass,
            vertices: [...currentColorVertices]
        });

        // Visualize this color class
        await visualizeColorClass(currentColorVertices, colorClass, colors[colorClass % colors.length]);

        colorClass++;
    }

    updateInfo(`Algorithm complete! Chromatic number: ${colorClass}`);
    displayColorLegend(colorAssignments, colors);

    return { vertexColors, chromaticNumber: colorClass };
}

// Visualize coloring a set of vertices
async function visualizeColorClass(vertices, colorClass, color) {
    updateInfo(`Coloring class ${colorClass + 1} with vertices: ${vertices.join(', ')}`);

    for (let v of vertices) {
        nodes.update({
            id: v,
            color: { background: color, border: '#1e293b' }
        });
        await sleep(500);
    }
    await sleep(300);
}

// Display color legend
function displayColorLegend(assignments, colors) {
    const legend = document.getElementById('color-legend');
    if (!legend) return; // Element doesn't exist, skip legend display
    
    const legendItems = document.getElementById('legend-items');
    if (!legendItems) return; // Element doesn't exist, skip legend display
    
    legendItems.innerHTML = '';

    assignments.forEach(assignment => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.innerHTML = `
            <div class="color-box" style="background-color: ${colors[assignment.color % colors.length]}"></div>
            <span>Class ${assignment.color + 1}: Vertices ${assignment.vertices.join(', ')}</span>
        `;
        legendItems.appendChild(item);
    });

    legend.style.display = 'block';
}

// Update info text
function updateInfo(text) {
    document.getElementById('algo-info').textContent = text;
}

// Sleep function for animation
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//bellmand-ford function 
function bellmanFord(bellmatrix, source) {
    const n = bellmatrix.length;
    let dist = Array(n).fill(Infinity);
    dist[source] = 0;

    let history = [];
    history.push({ step: "Init", dist: [...dist] });

    // Relax edges |V|-1 times
    for (let k = 1; k <= n - 1; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (bellmatrix[i][j] > 0 && dist[i] !== Infinity) {
                    if (dist[i] + bellmatrix[i][j] < dist[j]) {
                        dist[j] = dist[i] + bellmatrix[i][j];
                    }
                }
            }
        }
        history.push({ step: k, dist: [...dist] });
    }

    return history; // used for table + coloring
}
// Color nodes by distance
function colorByDistance(distances) {
    distances.forEach((d, i) => {
        let color = '#94a3b8'; // default gray

        if (d !== Infinity) {
            color = colors[d % colors.length];
        }

        nodes.update({
            id: i,
            color: { background: color, border: '#1e293b' }
        });
    });
}


// Start button handler
document.getElementById('tp5-start-btn').addEventListener('click', async () => {
    try {
        const bellmanmatrixValue = document.getElementById('bellmand-ford-matrix').value;
        const input = document.getElementById('tp5-array-input').value;
        const algo = document.getElementById('tp5-algo-select').value;

        if (algo === 'rlf') {
            const matrix = parseMatrix(input);
            createGraphFromMatrix(matrix);
            await sleep(1000);
            updateInfo('Running Recursive Largest First (RLF)...');
            await rlfAlgorithm(matrix);
        }
        else if (algo === 'bellman') {
            const bellmatrix = parseWeightedMatrix(bellmanmatrixValue); // Use weighted parser
            createDirectedGraphFromWeightedMatrix(bellmatrix); // Create directed graph
            await sleep(1000);

            const source = parseInt(document.getElementById('bf-source').value);
            updateInfo(`Running Bellman-Ford from source ${source}...`);

            const history = bellmanFord(bellmatrix, source); // Pass correct variable
            const finalDistances = history[history.length - 1].dist;

            colorByDistance(finalDistances);
            renderBellmanTable(history);
        }

    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Render the Bellman-Ford table in HTML
function renderBellmanTable(history) {
    // Ensure the container is visible
    const container = document.getElementById('bf-table-container');
    container.style.display = 'block';

    const thead = document.querySelector('#bfTable thead');
    const tbody = document.querySelector('#bfTable tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Number of vertices
    const n = history[0].dist.length;

    // Create table header
    let header = '<tr><th>Iteration</th>';
    for (let i = 0; i < n; i++) {
        header += `<th>d(${i})</th>`;
    }
    header += '</tr>';
    thead.innerHTML = header;

    // Create table body
    history.forEach(row => {
        let tr = `<tr><td>${row.step}</td>`;
        row.dist.forEach(d => {
            tr += `<td>${d === Infinity ? '∞' : d}</td>`;
        });
        tr += '</tr>';
        tbody.innerHTML += tr;
    });
}



// Reset button handler
document.getElementById('tp5-reset-btn').addEventListener('click', () => {
    nodes.clear();
    edges.clear();
    const legend = document.getElementById('color-legend');
    if (legend) legend.style.display = 'none';
    updateInfo('Enter an adjacency matrix and click "Visualize RLF" to see the algorithm in action.');
});

// Initialize on load
initNetwork();

const algoSelect = document.getElementById('tp5-algo-select');
const startBtn = document.getElementById('tp5-start-btn');
const bellmanMatrix = document.getElementById('bellmand-ford-matrix');
const rlfMatrix = document.querySelector('.rlf-matrix');
const bellmandInfoBox = document.querySelector('#bellmand-info-box');
const rlfInfoBox = document.querySelector('#rlf-info-box');
const bfOptions = document.getElementById('bf-options');

algoSelect.addEventListener('change', () => {
    const bfTableContainer = document.getElementById('bf-table-container');
    if (algoSelect.value === 'bellman') {
        startBtn.textContent = 'Visualiser Bellman-Ford';
        if (bellmanMatrix) bellmanMatrix.style.display = 'block';
        if (rlfMatrix) rlfMatrix.style.display = 'none';
        if (bellmandInfoBox) bellmandInfoBox.style.display = 'block';
        if (rlfInfoBox) rlfInfoBox.style.display = 'none';
        if (bfTableContainer) bfTableContainer.style.display = 'block';
        if (bfOptions) bfOptions.style.display = 'block';

    } else {
        startBtn.textContent = 'Visualiser RLF';
        if (bellmanMatrix) bellmanMatrix.style.display = 'none';
        if (rlfMatrix) rlfMatrix.style.display = 'block';
        if (bellmandInfoBox) bellmandInfoBox.style.display = 'none';
        if (rlfInfoBox) rlfInfoBox.style.display = 'block';
        if (bfTableContainer) bfTableContainer.style.display = 'none';
        if (bfOptions) bfOptions.style.display = 'none';
    }
});
