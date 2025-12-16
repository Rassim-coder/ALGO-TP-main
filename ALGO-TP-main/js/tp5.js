let network = null;
let nodes, edges;
const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Helper to convert indices (0, 1, 2) to labels (A, B, C)
function indexToLabel(index) {
    if (typeof index === 'number' && index >= 0) {
        return String.fromCharCode(65 + index);
    }
    return String(index);
}

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

// Parse adjacency matrix (for RLF, 0/1)
function parseMatrix(input) {
    const rows = input.trim().split('\n').filter(r => r.trim());
    const matrix = rows.map(row =>
        row.split(',').map(val => parseInt(val.trim()))
    );

    if (matrix.length === 0) throw new Error('Empty RLF matrix');
    const n = matrix.length;
    if (!matrix.every(row => row.length === n)) {
        throw new Error('RLF Matrix must be square');
    }

    return matrix;
}

// Parse bellmand-ford matrix (weighted)
function parseWeightedMatrix(bellmanMatrix) {
    const rows = bellmanMatrix.trim().split('\n').filter(r => r.trim());

    const bellmatrix = rows.map(row =>
        row
            .trim()
            .split(/[\s,]+/)    // space OR comma
            .map(val => {
                const num = Number(val);
                if (isNaN(num)) {
                    throw new Error("Invalid number in Bellman-Ford matrix");
                }
                return num;
            })
    );

    if (bellmatrix.length === 0) {
        throw new Error("Empty Bellman-Ford matrix");
    }

    const n = bellmatrix.length;
    if (!bellmatrix.every(row => row.length === n)) {
        throw new Error("Bellman-Ford Matrix must be square");
    }

    return bellmatrix;
}

// Create directed graph from weighted matrix (Bellman-Ford)
function createDirectedGraphFromWeightedMatrix(bellmatrix) {
    const n = bellmatrix.length;
    nodes.clear();
    edges.clear();

    for (let i = 0; i < n; i++) {
        // Use the consistent letter label (A, B, C, ...)
        const label = indexToLabel(i);

        nodes.add({
            id: i,
            label: label,
            color: { background: '#94a3b8', border: '#64748b' }
        });
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (bellmatrix[i][j] !== 0) {
                edges.add({
                    from: i,
                    to: j,
                    label: String(bellmatrix[i][j]),
                    arrows: 'to'
                });
            }
        }
    }
}


// Create graph from matrix (Used for RLF - Undirected)
function createGraphFromMatrix(matrix) {
    const n = matrix.length;
    nodes.clear();
    edges.clear();

    for (let i = 0; i < n; i++) {
        // Use the consistent letter label (A, B, C, ...)
        const label = indexToLabel(i);
        nodes.add({
            id: i,
            label: label,
            color: { background: '#94a3b8', border: '#64748b' }
        });
    }

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) { // Only check half the matrix (j > i) for undirected edges
            if (matrix[i][j] === 1) {
                edges.add({
                    from: i,
                    to: j,
                    arrows: undefined, // Undirected edges
                    value: 1
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

// Visualize coloring a set of vertices (RLF visualization)
async function visualizeColorClass(vertices, colorClass, color) {
    const vertexLabels = vertices.map(indexToLabel);
    updateInfo(`Coloring class ${colorClass + 1} with vertices: ${vertexLabels.join(', ')}`);

    for (let v of vertices) {
        nodes.update({
            id: v,
            color: { background: color, border: '#1e293b' }
        });
        await sleep(500);
    }
    await sleep(300);
}

// Display color legend (RLF results)
function displayColorLegend(assignments, colors) {
    const legend = document.getElementById('color-legend');
    const legendItems = document.getElementById('legend-items');
    legendItems.innerHTML = '';

    assignments.forEach(assignment => {
        const vertexLabels = assignment.vertices.map(indexToLabel);

        const item = document.createElement('div');
        item.className = 'color-item';
        item.innerHTML = `
            <div class="color-box" style="background-color: ${colors[assignment.color % colors.length]}"></div>
            <span>Class ${assignment.color + 1}: Vertices ${vertexLabels.join(', ')}</span>
        `;
        legendItems.appendChild(item);
    });

    legend.style.display = 'block';
}

// RLF Algorithm with visualization
async function rlfAlgorithm(matrix) {
    const n = matrix.length;
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

// Bellman-Ford algorithm
function bellmanFord(bellmatrix, source) {
    const n = bellmatrix.length;
    let dist = Array(n).fill(Infinity);
    let pred = Array(n).fill(null);
    dist[source] = 0;

    let history = [];

    history.push({ step: "Init", dist: [...dist], pred: [...pred], updated: true }); // added updated: true for init

    const edges = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (bellmatrix[i][j] !== 0) {
                edges.push({ from: i, to: j, weight: bellmatrix[i][j] });
            }
        }
    }

    let lastUpdatingPass = 0;
    // --- Core Bellman-Ford: Relax edges |V|-1 times ---
    for (let k = 1; k <= n - 1; k++) {
        let updatedInPass = false;
        let tempDist = [...dist];

        for (let edge of edges) {
            const { from, to, weight } = edge;
            if (dist[from] !== Infinity && dist[from] + weight < tempDist[to]) {
                tempDist[to] = dist[from] + weight;
                pred[to] = from;
                updatedInPass = true;
            }
        }

        dist = tempDist;

        if (updatedInPass) {
            lastUpdatingPass = k;
        }

        history.push({
            step: k,
            dist: [...dist],
            pred: [...pred],
            updated: updatedInPass
        });

        if (!updatedInPass) {
            break;
        }
    }

    // --- Negative Cycle Detection: Perform one more pass (the V-th pass) ---
    let negativeCycleDetected = false;
    for (let edge of edges) {
        const { from, to, weight } = edge;
        if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
            negativeCycleDetected = true;
            history.push({
                step: n, // Log the state after the Vth check (usually n or last pass + 1)
                dist: [...dist],
                pred: [...pred],
                message: "Negative cycle detected in final check.",
                updated: false // No update to the array, just detection
            });
            break;
        }
    }

    return {
        history,
        negativeCycleDetected,
        lastUpdatingPass: negativeCycleDetected ? n : lastUpdatingPass
    };
}

// Color nodes by distance (Bellman-Ford visualization)
function colorByDistance(distances) {
    // We use the global 'colors' array which is available.
    distances.forEach((d, i) => {
        let color = '#94a3b8'; // default gray

        if (d !== Infinity) {
            // Use modulo operator on the distance value
            color = colors[Math.abs(d) % colors.length];
        }

        nodes.update({
            id: i,
            color: { background: color, border: '#1e293b' },
            // Optional: Update label to show distance
            label: `${indexToLabel(i)} (${d === Infinity ? '∞' : d})`
        });
    });
}


// Render the Bellman-Ford table in HTML (Finalized to match image)
function renderBellmanTable(history) {
    // --- 1. Setup and Filtering ---
    const container = document.getElementById('bf-table-container');
    container.style.display = 'block';

    const table = document.getElementById('bfTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Filter history to get only the end-of-pass states (k=0, k=1, k=2, ...)
    const stepsByPass = {};
    history.forEach(item => {
        if (item.step === "Init") {
            stepsByPass[0] = item.dist;
        } else if (typeof item.step === 'number') {
            stepsByPass[item.step] = item.dist;
        }
    });

    const passKeys = Object.keys(stepsByPass).map(Number).sort((a, b) => a - b);

    // Determine the number of vertices (n) and the last calculated pass number (maxK)
    const n = history[history.length - 1].dist.length;
    const maxK = passKeys[passKeys.length - 1];
    const finalDistances = stepsByPass[maxK];

    // --- 2. Create Table Header ---
    let header = '<tr><th>k</th>';
    // Use lowercase letters (a, b, c, ...) for the table header notation λ^k(a)
    for (let i = 0; i < n; i++) {
        const label = String.fromCharCode(97 + i);
        header += `<th>&lambda;<sup>k</sup>(${label})</th>`;
    }
    header += '</tr>';
    thead.innerHTML = header;

    // --- 3. Create Table Body ---
    let bodyHTML = '';
    let previousDistances = Array(n).fill(Infinity);

    for (let i = 0; i < passKeys.length; i++) {
        const k = passKeys[i];
        const currentDistances = stepsByPass[k];

        // Break if this is the final state. It will be printed by the (fin) logic below.
        if (k === maxK && k !== 0) {
            break;
        }

        let rowLabel = k === 0 ? `0 (init)` : `${k}`;
        let tr = `<tr><td>${rowLabel}</td>`;

        // Populate cells for the current pass
        currentDistances.forEach((d, index) => {
            let cellContent = '';

            // Initial row (k=0) logic
            if (k === 0) {
                cellContent = d === 0 ? '0 (*)' : (d === Infinity ? '∞' : `${d}`);
            }
            // Regular iteration rows (k=1, k=2, ...)
            else {
                const prevD = previousDistances[index];

                if (d === Infinity) {
                    cellContent = '';
                } else if (d === prevD) {
                    cellContent = '';
                } else if (d < prevD) {
                    cellContent = `${d} (*)`; // New, better distance found
                }
            }
            tr += `<td>${cellContent}</td>`;
        });
        tr += '</tr>';
        bodyHTML += tr;

        previousDistances = [...currentDistances]; // Update previous distances
    }

    // --- Print the k (fin) row with final values outside the loop ---
    let finTr = `<tr><td>${maxK} (fin)</td>`;
    finalDistances.forEach((d) => {
        // Print ALL final values without the asterisk or blanking
        finTr += `<td>${d === Infinity ? '∞' : d}</td>`;
    });
    finTr += '</tr>';
    bodyHTML += finTr;

    tbody.innerHTML = bodyHTML;
}

// Start button handler
document.getElementById('tp5-start-btn').addEventListener('click', async () => {
    try {
        const algo = document.getElementById('tp5-algo-select').value;
        const bellmanmatrixValue = document.getElementById('bellmand-ford-matrix').value;
        const rlfMatrixValue = document.getElementById('tp5-array-input').value; // Corrected ID

        if (algo === 'rlf') {
            const matrix = parseMatrix(rlfMatrixValue);
            createGraphFromMatrix(matrix);
            await sleep(1000);
            updateInfo('Running Recursive Largest First (RLF)...');
            await rlfAlgorithm(matrix);
        }

        if (algo === 'bellman') {
            const bellmatrix = parseWeightedMatrix(bellmanmatrixValue);
            createDirectedGraphFromWeightedMatrix(bellmatrix);
            await sleep(1000);

            const source = parseInt(document.getElementById('bf-source').value);
            if (isNaN(source) || source < 0 || source >= bellmatrix.length) {
                throw new Error("Invalid source node index.");
            }
            updateInfo(`Running Bellman-Ford from source ${indexToLabel(source)}...`);

            const result = bellmanFord(bellmatrix, source);
            const history = result.history;
            const finalDistances = history[history.length - 1].dist;

            if (result.negativeCycleDetected) {
                updateInfo(`⚠️ **Negative Cycle Detected!** Shortest paths are undefined.`);
            } else {
                updateInfo(`Algorithm complete! Shortest paths from node ${indexToLabel(source)} calculated.`);
            }

            colorByDistance(finalDistances);
            renderBellmanTable(history);
        }

    } catch (error) {
        alert('Error: ' + error.message);
    }
});


// Reset button handler
document.getElementById('tp5-reset-btn').addEventListener('click', () => {
    nodes.clear();
    edges.clear();
    document.getElementById('color-legend').style.display = 'none';
    document.getElementById('bf-table-container').style.display = 'none';
    updateInfo('Algorithm visualizer ready. Choose an algorithm and enter a matrix.');
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

// Initial display setup based on the default selected algorithm
algoSelect.addEventListener('change', () => {
    const bfTableContainer = document.getElementById('bf-table-container');
    if (algoSelect.value === 'bellman') {
        startBtn.textContent = 'Visualiser Bellman-Ford';
        bellmanMatrix.style.display = 'block';
        rlfMatrix.style.display = 'none';
        bellmandInfoBox.style.display = 'block';
        rlfInfoBox.style.display = 'none';
        document.getElementById('color-legend').style.display = 'none';
        document.getElementById('bf-table-container').style.display = 'none';
    } else {
        startBtn.textContent = 'Visualiser RLF';
        bellmanMatrix.style.display = 'none';
        rlfMatrix.style.display = 'block';
        bellmandInfoBox.style.display = 'none';
        rlfInfoBox.style.display = 'block';
        document.getElementById('color-legend').style.display = 'none';
        document.getElementById('bf-table-container').style.display = 'none';
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