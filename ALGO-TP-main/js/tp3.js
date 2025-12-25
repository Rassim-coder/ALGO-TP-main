// Color constants
const RED = 'RED';
const BLACK = 'BLACK';

// NIL Sentinel Node - shared across the entire tree
// Represents all leaf nodes and simplifies boundary conditions
const NIL = {
  color: BLACK,
  left: null,
  right: null,
  parent: null,
  value: null,
  isNil: true
};

/**
 * Node class - represents a single node in the Red-Black Tree
 */
class RBNode {
  constructor(value) {
    this.value = value;
    this.color = RED; // New nodes are always inserted as RED
    this.left = NIL;  // Left child (initially NIL)
    this.right = NIL; // Right child (initially NIL)
    this.parent = NIL; // Parent node (initially NIL)
  }
}

/**
 * Red-Black Tree class - main tree structure with all operations
 */
class RedBlackTreeTP3 {
  constructor() {
    this.root = NIL; // Empty tree starts with NIL root
    this.animationSteps = []; // Stores steps for visualization
  }

  /**
   * Insert a new value into the tree
   * @param {number} value - The value to insert
   * @returns {Array} - Array of animation steps for visualization
   */
  insert(value) {
    this.animationSteps = []; // Reset animation steps

    // Step 1: Create new node
    const newNode = new RBNode(value); // Changed from Node to RBNode
    this.animationSteps.push({
      type: 'create',
      node: value,
      description: `Creating new node with value ${value}`
    });

    // Step 2: Perform standard BST insertion
    let parent = NIL;
    let current = this.root;

    // Find the correct position for the new node
    while (current !== NIL) {
      parent = current;
      this.animationSteps.push({
        type: 'traverse',
        node: current.value,
        description: `Comparing ${value} with ${current.value}`
      });

      if (value < current.value) {
        current = current.left;
      } else if (value > current.value) {
        current = current.right;
      } else {
        // Duplicate value - don't insert
        this.animationSteps.push({
          type: 'error',
          node: value,
          description: `Value ${value} already exists in tree`
        });
        return this.animationSteps;
      }
    }

    // Set parent of new node
    newNode.parent = parent;

    // Step 3: Link parent to new node
    if (parent === NIL) {
      // Tree was empty - new node becomes root
      this.root = newNode;
      this.animationSteps.push({
        type: 'set-root',
        node: value,
        description: `${value} becomes the root`
      });
    } else if (value < parent.value) {
      parent.left = newNode;
      this.animationSteps.push({
        type: 'insert-left',
        node: value,
        parent: parent.value,
        description: `Inserting ${value} as left child of ${parent.value}`
      });
    } else {
      parent.right = newNode;
      this.animationSteps.push({
        type: 'insert-right',
        node: value,
        parent: parent.value,
        description: `Inserting ${value} as right child of ${parent.value}`
      });
    }

    // Step 4: Fix Red-Black Tree properties
    this.fixInsert(newNode);

    return this.animationSteps;
  }

  /**
   * Fix Red-Black Tree properties after insertion
   * Handles cases where red node has red parent (violation of property 4)
   * @param {Node} node - The newly inserted node
   */
  fixInsert(node) {
    // While parent is red (violation of RB property)
    while (node.parent.color === RED) {

      // Case A: Parent is LEFT child of grandparent
      if (node.parent === node.parent.parent.left) {
        const uncle = node.parent.parent.right; // Uncle is right child

        // Case 1: Uncle is RED - recolor and move up
        if (uncle.color === RED) {
          this.animationSteps.push({
            type: 'case',
            caseNum: 1,
            description: 'Case 1: Uncle is red - recolor parent, uncle, and grandparent'
          });

          node.parent.color = BLACK;
          uncle.color = BLACK;
          node.parent.parent.color = RED;

          this.animationSteps.push({
            type: 'recolor',
            nodes: [node.parent.value, uncle.value, node.parent.parent.value],
            description: 'Recoloring parent and uncle to BLACK, grandparent to RED'
          });

          // Move up to grandparent
          node = node.parent.parent;
        } else {
          // Case 2: Node is RIGHT child - convert to case 3
          if (node === node.parent.right) {
            this.animationSteps.push({
              type: 'case',
              caseNum: 2,
              description: 'Case 2: Node is right child - left rotate to convert to case 3'
            });

            node = node.parent;
            this.leftRotate(node);
          }

          // Case 3: Node is LEFT child - recolor and rotate
          this.animationSteps.push({
            type: 'case',
            caseNum: 3,
            description: 'Case 3: Node is left child - recolor and right rotate'
          });

          node.parent.color = BLACK;
          node.parent.parent.color = RED;

          this.animationSteps.push({
            type: 'recolor',
            nodes: [node.parent.value, node.parent.parent.value],
            description: 'Recoloring parent to BLACK, grandparent to RED'
          });

          this.rightRotate(node.parent.parent);
        }
      }
      // Case B: Parent is RIGHT child of grandparent (mirror of Case A)
      else {
        const uncle = node.parent.parent.left; // Uncle is left child

        // Case 1: Uncle is RED
        if (uncle.color === RED) {
          this.animationSteps.push({
            type: 'case',
            caseNum: 1,
            description: 'Case 1 (mirror): Uncle is red - recolor'
          });

          node.parent.color = BLACK;
          uncle.color = BLACK;
          node.parent.parent.color = RED;

          this.animationSteps.push({
            type: 'recolor',
            nodes: [node.parent.value, uncle.value, node.parent.parent.value],
            description: 'Recoloring parent and uncle to BLACK, grandparent to RED'
          });

          node = node.parent.parent;
        } else {
          // Case 2: Node is LEFT child
          if (node === node.parent.left) {
            this.animationSteps.push({
              type: 'case',
              caseNum: 2,
              description: 'Case 2 (mirror): Node is left child - right rotate'
            });

            node = node.parent;
            this.rightRotate(node);
          }

          // Case 3: Node is RIGHT child
          this.animationSteps.push({
            type: 'case',
            caseNum: 3,
            description: 'Case 3 (mirror): Node is right child - recolor and left rotate'
          });

          node.parent.color = BLACK;
          node.parent.parent.color = RED;

          this.animationSteps.push({
            type: 'recolor',
            nodes: [node.parent.value, node.parent.parent.value],
            description: 'Recoloring parent to BLACK, grandparent to RED'
          });

          this.leftRotate(node.parent.parent);
        }
      }
    }

    // Ensure root is always BLACK (RB property 2)
    this.root.color = BLACK;
    this.animationSteps.push({
      type: 'recolor-root',
      node: this.root.value,
      description: 'Ensuring root is BLACK'
    });
  }

  /**
   * Left Rotation
   * Rotates the subtree so that node's right child becomes the new root of subtree
   * 
   *     x                y
   *    / \              / \
   *   a   y     =>     x   c
   *      / \          / \
   *     b   c        a   b
   * 
   * @param {Node} x - The node to rotate
   */
  leftRotate(x) {
    const y = x.right; // Set y as x's right child

    this.animationSteps.push({
      type: 'rotate-left',
      node: x.value,
      pivot: y.value,
      description: `Left rotating ${x.value} with pivot ${y.value}`
    });

    // Turn y's left subtree into x's right subtree
    x.right = y.left;
    if (y.left !== NIL) {
      y.left.parent = x;
    }

    // Link x's parent to y
    y.parent = x.parent;
    if (x.parent === NIL) {
      this.root = y; // y becomes new root
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    // Put x on y's left
    y.left = x;
    x.parent = y;
  }

  /**
   * Right Rotation
   * Rotates the subtree so that node's left child becomes the new root of subtree
   * 
   *       y            x
   *      / \          / \
   *     x   c   =>   a   y
   *    / \              / \
   *   a   b            b   c
   * 
   * @param {Node} y - The node to rotate
   */
  rightRotate(y) {
    const x = y.left; // Set x as y's left child

    this.animationSteps.push({
      type: 'rotate-right',
      node: y.value,
      pivot: x.value,
      description: `Right rotating ${y.value} with pivot ${x.value}`
    });

    // Turn x's right subtree into y's left subtree
    y.left = x.right;
    if (x.right !== NIL) {
      x.right.parent = y;
    }

    // Link y's parent to x
    x.parent = y.parent;
    if (y.parent === NIL) {
      this.root = x; // x becomes new root
    } else if (y === y.parent.right) {
      y.parent.right = x;
    } else {
      y.parent.left = x;
    }

    // Put y on x's right
    x.right = y;
    y.parent = x;
  }

  /**
   * In-order traversal of the tree
   * @returns {Array} - Array of node values in sorted order
   */
  inorderTraversal() {
    const result = [];
    this._inorderHelper(this.root, result);
    return result;
  }

  _inorderHelper(node, result) {
    if (node !== NIL) {
      this._inorderHelper(node.left, result);
      result.push({ value: node.value, color: node.color });
      this._inorderHelper(node.right, result);
    }
  }

  /**
   * Get tree as array for visualization
   * Returns all nodes with their properties
   * @returns {Array} - Array of all nodes with metadata
   */
  getTreeData() {
    const nodes = [];
    this._collectNodes(this.root, nodes);
    return nodes;
  }

  _collectNodes(node, nodes) {
    if (node !== NIL) {
      nodes.push({
        value: node.value,
        color: node.color,
        left: node.left !== NIL ? node.left.value : null,
        right: node.right !== NIL ? node.right.value : null,
        parent: node.parent !== NIL ? node.parent.value : null
      });
      this._collectNodes(node.left, nodes);
      this._collectNodes(node.right, nodes);
    }
  }

  // --- Added: height, node count and black-height utilities ---
  /**
   * Get height of tree (number of nodes on longest path)
   * @param {Object} node
   * @returns {number}
   */
  getHeight(node = this.root) {
    if (node === NIL || node === null) return 0;
    const lh = this.getHeight(node.left);
    const rh = this.getHeight(node.right);
    return 1 + Math.max(lh, rh);
  }

  /**
   * Count total real nodes (exclude NIL sentinel)
   * @param {Object} node
   * @returns {number}
   */
  countNodes(node = this.root) {
    if (node === NIL || node === null) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  /**
   * Compute black-height (number of black nodes on a path to a leaf)
   * We return the black-count along the leftmost path (valid for RB-tree)
   * @param {Object} node
   * @returns {number}
   */
  getBlackHeight(node = this.root) {
    if (node === NIL || node === null) return 0;
    const leftBlack = this.getBlackHeight(node.left);
    return leftBlack + (node.color === BLACK ? 1 : 0);
  }

  /**
   * Search for a value in the tree.
   * Returns an object { found: boolean, path: [visited values] }.
   */
  search(value) {
    const path = [];
    let node = this.root;
    while (node !== NIL) {
      path.push(node.value);
      if (value === node.value) {
        return { found: true, path };
      } else if (value < node.value) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    return { found: false, path };
  }

  /**
   * Find minimum node starting from given node
   */
  minimum(node) {
    while (node.left !== NIL) {
      node = node.left;
    }
    return node;
  }

  /**
   * Transplant subtree u with subtree v (helper for delete)
   */
  transplant(u, v) {
    if (u.parent === NIL) {
      this.root = v;
    } else if (u === u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    v.parent = u.parent;
  }

  /**
   * Delete a value from the tree (BST-style delete using NIL sentinel).
   * Note: This performs structural removal and keeps root black but does not
   * implement the full red-black delete-fixup logic. Returns true if deleted.
   */
  delete(value) {
    // Find node to delete
    let z = this.root;
    while (z !== NIL && z.value !== value) {
      if (value < z.value) z = z.left; else z = z.right;
    }
    if (z === NIL) return false; // not found

    let y = z;
    // y is node actually removed from tree (y may be z or successor)
    if (z.left === NIL) {
      this.transplant(z, z.right);
    } else if (z.right === NIL) {
      this.transplant(z, z.left);
    } else {
      y = this.minimum(z.right);
      if (y.parent !== z) {
        this.transplant(y, y.right);
        y.right = z.right;
        if (y.right !== NIL) y.right.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      if (y.left !== NIL) y.left.parent = y;
      // copy color if needed; keep y.color as originally set
    }

    // Ensure root is black for consistency
    if (this.root !== NIL) this.root.color = BLACK;

    // record animation step (optional, keeps similar API)
    this.animationSteps.push({
      type: 'delete',
      node: value,
      description: `Deleted node ${value} (BST-style).`
    });

    return true;
  }
}

class TreeVisualizerTP3 {
  /**
   * Initialize the visualizer
   * @param {string} containerId - ID of the HTML element to render the tree
   * @param {RedBlackTree} tree - The Red-Black Tree instance to visualize
   */
  constructor(containerId, tree) {
    this.container = document.getElementById(containerId);
    this.tree = tree;
    this.network = null;

    // vis.js data sets for nodes and edges
    this.nodes = new vis.DataSet([]);
    this.edges = new vis.DataSet([]);

    // Initialize the network
    this.initNetwork();
  }

  /**
   * Initialize vis.js Network with configuration
   */
  initNetwork() {
    // Network data
    const data = {
      nodes: this.nodes,
      edges: this.edges
    };

    // Network options - configure appearance and behavior
    const options = {
      layout: {
        hierarchical: false // Disable hierarchical layout - we'll position manually
      },
      nodes: {
        shape: 'circle',
        size: 30,
        font: {
          size: 16,
          color: '#ffffff',
          face: 'Arial',
          bold: true
        },
        borderWidth: 3,
        borderWidthSelected: 5,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.3)',
          size: 10,
          x: 3,
          y: 3
        }
      },
      edges: {
        width: 3,
        color: {
          color: '#848484',
          highlight: '#2B7CE9',
          hover: '#2B7CE9'
        },
        smooth: false, // Straight lines instead of curves
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5
          }
        }
      },
      physics: {
        enabled: false // Disable physics for stable tree layout
      },
      interaction: {
        dragNodes: false, // Prevent dragging nodes
        dragView: true, // Allow dragging the canvas
        zoomView: true, // Allow zooming
        selectable: true
      }
    };

    // Create the network
    this.network = new vis.Network(this.container, data, options);

    // Add event listeners
    this.addEventListeners();
  }

  /**
   * Add event listeners for network interactions
   */
  addEventListeners() {
    // Click event on nodes
    this.network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        console.log(`Clicked node: ${nodeId}`);
        // You can add custom behavior here
      }
    });

    // Double click to fit view
    this.network.on('doubleClick', () => {
      this.network.fit({
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      });
    });
  }

  /**
   * Convert Red-Black Tree to vis.js format and render
   * Traverses the tree and creates nodes and edges
   */
  render() {
    // Clear existing nodes and edges
    this.nodes.clear();
    this.edges.clear();

    // If tree is empty, just return
    if (this.tree.root === NIL || this.tree.root === null) { // Fixed the undefined 'node' reference
      return;
    }

    // Calculate x-positions using in-order traversal
    this.xCounter = 0;
    this._calculatePositions(this.tree.root);

    // Reset counter and build the tree
    this.xCounter = 0;
    this._traverseAndBuild(this.tree.root, 0);

    // Fit the network to show all nodes
    setTimeout(() => {
      this.network.fit({
        animation: {
          duration: 300,
          easingFunction: 'easeInOutQuad'
        }
      });
    }, 100);
  }

  /**
   * Calculate x-positions for nodes using in-order traversal
   * This ensures left nodes are always left of right nodes
   * @param {Node} node - Current node
   */
  _calculatePositions(node) {
    if (node === NIL) {
      return;
    }

    // Traverse left subtree
    this._calculatePositions(node.left);

    // Assign x-position to current node
    node.xPos = this.xCounter++;

    // Traverse right subtree
    this._calculatePositions(node.right);
  }

  /**
   * Recursive helper to traverse tree and build vis.js nodes/edges
   * @param {Node} node - Current node being processed
   * @param {number} level - Current level in the tree (0 = root)
   */
  _traverseAndBuild(node, level) {
    if (node === NIL) {
      return;
    }

    // Create vis.js node with level and x-position
    const visNode = this._createVisNode(node, level);
    this.nodes.add(visNode);

    // Process left child
    if (node.left !== NIL) {
      // Create edge from parent to left child
      this.edges.add({
        from: node.value,
        to: node.left.value,
        label: 'L', // Label for left edge
        font: { size: 10, color: '#666666', align: 'top' }
      });
      this._traverseAndBuild(node.left, level + 1);
    }

    // Process right child
    if (node.right !== NIL) {
      // Create edge from parent to right child
      this.edges.add({
        from: node.value,
        to: node.right.value,
        label: 'R', // Label for right edge
        font: { size: 10, color: '#666666', align: 'top' }
      });
      this._traverseAndBuild(node.right, level + 1);
    }
  }

  /**
   * Create a vis.js node object from a tree node
   * @param {Node} node - Tree node
   * @param {number} level - Level of the node in the tree
   * @returns {Object} - vis.js node configuration
   */
  _createVisNode(node, level) {
    // Determine color based on node color
    const backgroundColor = node.color === RED ? '#E74C3C' : '#2C3E50';
    const borderColor = node.color === RED ? '#C0392B' : '#1A252F';

    return {
      id: node.value,
      label: node.value.toString(),
      level: level, // Set the level for hierarchical layout
      x: node.xPos * 100, // Reduced from 200 to 100 for tighter spacing
      y: level * 120, // Set y-coordinate based on level
      fixed: { x: true, y: true }, // Fix position so vis.js doesn't move it
      color: {
        background: backgroundColor,
        border: borderColor,
        highlight: {
          background: node.color === RED ? '#FF6B6B' : '#34495E',
          border: borderColor
        },
        hover: {
          background: node.color === RED ? '#FF6B6B' : '#34495E',
          border: borderColor
        }
      },
      font: {
        color: '#FFFFFF'
      }
    };
  }

  /**
   * Highlight a specific node (used during animations)
   * @param {number} nodeValue - Value of the node to highlight
   * @param {string} color - Highlight color (default: yellow)
   */
  highlightNode(nodeValue, color = '#F39C12') {
    const node = this.nodes.get(nodeValue);
    if (node) {
      this.nodes.update({
        id: nodeValue,
        color: {
          background: color,
          border: '#E67E22'
        }
      });
    }
  }

  /**
   * Reset node to its original color based on tree structure
   * @param {number} nodeValue - Value of the node to reset
   */
  resetNodeColor(nodeValue) {
    // Find the node in the tree
    const result = this._findNodeWithLevel(this.tree.root, nodeValue, 0);
    if (result && result.node !== NIL) {
      const visNode = this._createVisNode(result.node, result.level);
      this.nodes.update(visNode);
    }
  }

  /**
   * Helper to find a node in the tree by value and get its level
   * @param {Node} node - Current node
   * @param {number} value - Value to search for
   * @param {number} level - Current level
   * @returns {Object|null} - Object with node and level, or null
   */
  _findNodeWithLevel(node, value, level) {
    if (node === NIL) {
      return null;
    }
    if (node.value === value) {
      return { node: node, level: level };
    }
    if (value < node.value) {
      return this._findNodeWithLevel(node.left, value, level + 1);
    } else {
      return this._findNodeWithLevel(node.right, value, level + 1);
    }
  }

  /**
   * Helper to find a node in the tree by value (old method for compatibility)
   * @param {Node} node - Current node
   * @param {number} value - Value to search for
   * @returns {Node|null} - Found node or null
   */
  _findNode(node, value) {
    if (node === NIL) {
      return null;
    }
    if (node.value === value) {
      return node;
    }
    if (value < node.value) {
      return this._findNode(node.left, value);
    } else {
      return this._findNode(node.right, value);
    }
  }

  /**
   * Update a specific node's color
   * @param {number} nodeValue - Value of the node
   * @param {string} color - New color ('RED' or 'BLACK')
   */
  updateNodeColor(nodeValue, color) {
    const backgroundColor = color === RED ? '#E74C3C' : '#2C3E50';
    const borderColor = color === RED ? '#C0392B' : '#1A252F';

    this.nodes.update({
      id: nodeValue,
      color: {
        background: backgroundColor,
        border: borderColor
      }
    });
  }

  /**
   * Highlight multiple nodes at once
   * @param {Array} nodeValues - Array of node values to highlight
   * @param {string} color - Highlight color
   */
  highlightNodes(nodeValues, color = '#F39C12') {
    nodeValues.forEach(value => {
      this.highlightNode(value, color);
    });
  }

  /**
   * Reset all nodes to their original colors
   */
  resetAllColors() {
    const treeData = this.tree.getTreeData();
    treeData.forEach(nodeData => {
      this.updateNodeColor(nodeData.value, nodeData.color);
    });
  }

  /**
   * Fit the network view to show all nodes
   */
  fitView() {
    this.network.fit({
      animation: {
        duration: 500,
        easingFunction: 'easeInOutQuad'
      }
    });
  }

  /**
   * Clear the entire visualization
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
  }

  /**
   * Get network instance (useful for advanced operations)
   * @returns {vis.Network} - The vis.js network instance
   */
  getNetwork() {
    return this.network;
  }
}




document.getElementById('tp3-gen-btn').addEventListener('click', function () {
  // A good sequence for demonstrating Red-Black Tree insertions and balancing
  const defaultValues = "10, 20, 30, 15, 5, 25";
  const inputArea = document.getElementById('tp3-bulk-values');

  // Set the value of the bulk input field
  inputArea.value = defaultValues;

  // Optional: Clear the single node value input
  document.getElementById('tp3-node-value').value = '';
});