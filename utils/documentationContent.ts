
export const DOCUMENTATION_MARKDOWN = `
<h1>Portul v1.0 Language Manual</h1>
<p>Portul (Puerta de Lógica) is a hyper-efficient, ergonomic language designed for minimal hardware. Its philosophy is based on a compact vocabulary and direct translation to machine operations.</p>

<h2>Core Principles</h2>
<ul>
  <li><strong>Minimal Vocabulary:</strong> Keywords are 3-7 letters long for cognitive and memory efficiency.</li>
  <li><strong>Direct Mapping:</strong> Syntax is designed to map closely to assembly-like operations.</li>
  <li><strong>Zero Overhead:</strong> The language avoids complex abstractions that hide computational cost.</li>
</ul>

<hr/>

<h2>1. Basic Syntax</h2>
<h3>Variables & Types</h3>
<p>Only one numeric type exists: <code>num</code>. All variables are declared and assigned on one line.</p>
<pre><code class="language-portul"># Declare a number 'x' with value 10
num x = 10
</code></pre>

<h3>Operations</h3>
<p>Operations use a prefix notation. They are direct commands to the compiler.</p>
<pre><code class="language-portul">num x = 10
num y = 20

add x y  # x now becomes 30 (x = x + y)
mul x 2  # x now becomes 60 (x = x * 2)
</code></pre>

<h3>Control Flow</h3>
<h4>Loops</h4>
<p>The <code>for</code> loop is a simple counter from a start value up to (but not including) an end value.</p>
<pre><code class="language-portul"># Loop a variable 'i' from 0 to 9
for i 0 10 {
    inc i       # Increment i
    put "loop"
}
</code></pre>

<h4>Conditionals</h4>
<p>The <code>if</code> statement is paired with a condition operation like <code>gt</code> (greater than).</p>
<pre><code class="language-portul">num score = 100
num high_score = 90

if gt score high_score {
    put "New high score!"
}
</code></pre>

<hr/>

<h2>2. Functions & Modules</h2>
<h3>Defining Functions</h3>
<p>Use <code>new</code> to define a new function, specify parameters with their type, and use <code>ret</code> to return a value.</p>
<pre><code class="language-portul"># Defines a function 'calc' that takes two numbers
new calc num a num b {
    add a b
    ret a
}
</code></pre>

<h3>Using Modules</h3>
<p>The <code>use</code> keyword imports all functions from another file.</p>
<pre><code class="language-portul"># In main.portul
use "utils.portul"

# Assumes 'print_status' is defined in utils.portul
run print_status
</code></pre>

<hr/>

<h2>3. Portul v1.0 Keyword List</h2>
<ul>
    <li><strong>Types:</strong> <code>num</code>, <code>txt</code>, <code>ary</code>, <code>ptr</code></li>
    <li><strong>Control:</strong> <code>if</code>, <code>for</code>, <code>ret</code>, <code>cal</code>, <code>run</code></li>
    <li><strong>Operations:</strong> <code>add</code>, <code>sub</code>, <code>mul</code>, <code>div</code>, <code>inc</code>, <code>gt</code>, <code>lt</code>, <code>equ</code></li>
    <li><strong>I/O:</strong> <code>put</code> (print), <code>get</code> (input)</li>
    <li><strong>Functions:</strong> <code>new</code>, <code>use</code></li>
    <li><strong>Hints:</strong> <code>fast</code> (tells the compiler to use register-only operations if possible)</li>
</ul>

<h3>The <code>Portul.build</code> File</h3>
<p>Configures the project build target and entry point.</p>
<pre><code class="language-portul"># Build Configuration
project: "My_Project"
entry: "main.portul"
target: "1MHz_7KB_RAM"
optimization: "fast"
</code></pre>
`;
