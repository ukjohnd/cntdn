/* Javascript version of cntdn
 *
 * Countdown game solver
 *
 * James Stanley 2013
 */

function _recurse_solve_letters(letters, node, used_letter, cb, answer) {
    if (node[0])
        cb(answer);

    if (answer.length == letters.length)
        return;

    var done = {};

    for (var i = 0; i < letters.length; i++) {
        var c = letters.charAt(i);

        if (used_letter[i] || done[c])
            continue;

        if (node[c]) {
            used_letter[i] = true;
            done[c] = true;
            _recurse_solve_letters(letters, node[c], used_letter, cb, answer+c);
            used_letter[i] = false;
        }
    }
}

function solve_letters(letters, cb) {
    _recurse_solve_letters(letters, dictionary, {}, cb, '');
}

var bestdiff;
var bestops;
var bestvalsums;

var OPS = {
    "+": function(n1, n2) { if (n1 < 0 || n2 < 0) return false; return n1+n2; },
    "-": function(n1, n2) { if (n2 >= n1) return false; return n1-n2; },
    "_": function(n2, n1) { if (n2 >= n1) return false; return n1-n2; },
    "*": function(n1, n2) { return n1*n2; },
    "/": function(n1, n2) { if (n2 == 0 || n1%n2 != 0) return false; return n1/n2; },
    "?": function(n2, n1) { if (n2 == 0 || n1%n2 != 0) return false; return n1/n2; },
};

function _recurse_solve_numbers(numbers, target, levels, howto, valsums) {
    levels--;

    for (var i = 0; i < numbers.length-1; i++) {
        var ni = numbers[i];

        if (ni === false)
            continue;

        numbers[i] = false;

        for (var j = i+1; j < numbers.length; j++) {
            var nj = numbers[j];

            if (nj === false)
                continue;

            for (var o in OPS) {
                var r = OPS[o](ni, nj);
                if (r === false)
                    continue;

                howto.push([ni, o, nj, r]);

                var op_cost = Math.abs(r);
                while (op_cost % 10 == 0 && op_cost != 0)
                    op_cost /= 10;

                var newvalsums = valsums + op_cost;

                if ((Math.abs(r - target) < Math.abs(bestresult - target))
                        || (Math.abs(r - target) == Math.abs(bestresult - target) && newvalsums < bestvalsums)) {
                    bestresult = r;
                    bestops = howto.slice(0);
                    bestvalsums = newvalsums;
                }

                numbers[j] = r;

                if (levels > 0)
                    _recurse_solve_numbers(numbers, target, levels, howto, newvalsums);

                howto.pop();

                numbers[j] = nj;
            }
        }

        numbers[i] = ni;
    }
}

function tidyup_result(result) {
    var mapping = {
        "?": "/", "_": "-"
    };

    var dontswap = {
        "/": 1, "-": 1
    };

    for (var i = 0; i < result.length; i++) {
        var subresult = result[i];

        var canswap

        if (subresult[1] in mapping) {
            subresult[1] = mapping[subresult[1]];
            var j = subresult[0];
            subresult[0] = subresult[2];
            subresult[2] = j;
        } else if (subresult[0] < subresult[2] && !(subresult[1] in dontswap)) {
            var j = subresult[0];
            subresult[0] = subresult[2];
            subresult[2] = j;
        }
    }

    /* simplify ordering of operations */
    var already_swapped = {};
    var donesomething = true;
    while (donesomething) {
        donesomething = false;

        for (var i = 0; i < result.length - 1; i++) {
            /* if result i is not used in expression i+1, we can swap them */
            if (result[i+1][0] != result[i][3]
                    && result[i+1][2] != result[i][3]
                    && !(result[i]+result[i+1] in already_swapped)) {
                var tmp = result[i];
                result[i] = result[i+1];
                result[i+1] = tmp;
                already_swapped[result[i]+result[i+1]] = true;
                already_swapped[result[i+1]+result[i]] = true;
                donesomething = true;
            }
        }
    }

    return result;
}

function solve_numbers(numbers, target) {
    numbers.sort();
    bestresult = numbers[0];
    bestops = [];

    /* see if one of these numbers is the answer */
    for (var i = 1; i < numbers.length; i++) {
        if (Math.abs(numbers[i] - target) < Math.abs(bestresult - target)) {
            bestresult = numbers[i];
            bestops = [];
            bestvalsums = numbers[i];
        }
    }
    if (bestresult == target)
        return [bestresult, bestops];

    /* attempt to solve with dfs */
    _recurse_solve_numbers(numbers, target, numbers.length, [], 0);
    bestops = tidyup_result(bestops);

    /* return best answer */
    return [bestresult, bestops];
}
