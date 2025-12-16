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
// create bellmand graph from matrix
function createDirectedGraphFromWeightedMatrix(bellmatrix) {
    const n = bellmatrix.length;
    nodes.clear();
    edges.clear();

    for (let i = 0; i < n; i++) {
        // Get the uppercase letter label (0 -> A, 1 -> B, ...)
        const label = String.fromCharCode(65 + i);

        nodes.add({
            id: i,
            label: label, // Changed from `${i}` to the letter
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
//bellmand-ford function 
function bellmanFord(bellmatrix, source) {
    const n = bellmatrix.length;
    // dist: Array to store the shortest distance from source to each node
    let dist = Array(n).fill(Infinity);
    // pred: Array to store the predecessor of each node (for path reconstruction)
    let pred = Array(n).fill(null);
    dist[source] = 0;

    let history = [];

    // Log Initial state (k=0)
    history.push({ step: "Init", dist: [...dist], pred: [...pred] });

    // Build edge list: { from, to, weight }
    const edges = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (bellmatrix[i][j] !== 0) {
                edges.push({ from: i, to: j, weight: bellmatrix[i][j] });
            }
        }
    }

    // --- Core Bellman-Ford: Relax edges |V|-1 times ---
    for (let k = 1; k <= n - 1; k++) {
        let updatedInPass = false;
        let tempDist = [...dist]; // Use a temporary array to calculate the state for this pass

        // Process each edge
        for (let edge of edges) {
            const { from, to, weight } = edge;
            // Relaxation step
            if (dist[from] !== Infinity && dist[from] + weight < tempDist[to]) {
                tempDist[to] = dist[from] + weight; // Update the temp distance
                pred[to] = from; // Update predecessor
                updatedInPass = true;
            }
        }

        // Update the master distance array only at the end of the pass
        dist = tempDist;

        // Log the state at the end of pass k (This is the crucial step for the table)
        history.push({
            step: k,
            dist: [...dist],
            pred: [...pred],
            updated: updatedInPass // Note if any change occurred in this pass
        });

        // Optimization: If no distances were updated in this pass, all shortest paths are found.
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
            // The step "n" (or V) will mark the state where the cycle was found
            history.push({
                step: n,
                dist: [...dist],
                pred: [...pred],
                message: "Negative cycle detected in final check."
            });
            break;
        }
    }

    return {
        history,
        negativeCycleDetected
    };
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
// Start button handler (The update needs to happen here)
document.getElementById('tp5-start-btn').addEventListener('click', async () => {
    try {
        const bellmanmatrixValue = document.getElementById('bellmand-ford-matrix').value;
        const input = document.getElementById('tp5-array-input').value;
        const algo = document.getElementById('tp5-algo-select').value;

        // ... (RLF logic is unchanged)

        if (algo === 'bellman') {
            const bellmatrix = parseWeightedMatrix(bellmanmatrixValue); // Use weighted parser
            createDirectedGraphFromWeightedMatrix(bellmatrix); // Create directed graph
            await sleep(1000);

            const source = parseInt(document.getElementById('bf-source').value);
            updateInfo(`Running Bellman-Ford from source ${source}...`);

            // --- Capture the new return object ---
            const result = bellmanFord(bellmatrix, source);
            const history = result.history;
            const finalDistances = history[history.length - 1].dist;
            // -------------------------------------

            if (result.negativeCycleDetected) {
                updateInfo(`⚠️ **Negative Cycle Detected!** Shortest paths are undefined.`);
                // You might want to color the nodes by distance, but the distances are not true shortest paths.
                colorByDistance(finalDistances);
            } else {
                updateInfo(`Algorithm complete! Shortest paths from node ${source} calculated.`);
                colorByDistance(finalDistances);
            }

            renderBellmanTable(history);
        }

    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Render the Bellman-Ford table in HTML 
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
    let lastUpdatingPassK = 0; // Track the highest K that actually had an update

    history.forEach(item => {
        if (item.step === "Init") {
            stepsByPass[0] = item.dist;
        } else if (typeof item.step === 'number') {
            stepsByPass[item.step] = item.dist;
            // The item from the Bellman-Ford function should ideally include an 'updated' flag.
            // Since the final state where the algorithm breaks due to no updates is the one we want to skip,
            // we'll keep track of the pass number. We assume the pass *before* the last logged one 
            // is the one where the last updates happened (in case of an early break).

            // NOTE: If the history includes a flag like `item.updated === true`, this logic would be simpler.
            // Assuming your Bellman-Ford breaks early, the last item in `stepsByPass` is the final state.
            lastUpdatingPassK = item.step;
        }
    });

    const passKeys = Object.keys(stepsByPass).map(Number).sort((a, b) => a - b);

    // Determine the number of vertices (n) and the last calculated pass number (maxK)
    const n = history[history.length - 1].dist.length;
    const maxK = passKeys[passKeys.length - 1];
    const finalDistances = stepsByPass[maxK]; // The result after the last relaxation pass

    // --- 2. Create Table Header ---
    let header = '<tr><th>k</th>';
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

        // --- Skip the final (empty) pass if it was logged and we're ready for the 'fin' row ---
        // We only want to display the final result in the (fin) row.
        if (k === maxK && k !== 0) {
            // If k is the final logged pass, we will only show the k(fin) row below, so we skip the regular k row here.
            // This assumes the row for k=3 in your image was the final pass state (which was blank).
            // Since we're removing the blank row, we stop the loop here and move to the 'fin' printout.
            break;
        }
        // --------------------------------------------------------------------------------------


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
