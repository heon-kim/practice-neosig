!(function (e) {
  var t = {};
  function i(s) {
    if (t[s]) return t[s].exports;
    var n = (t[s] = { i: s, l: !1, exports: {} });
    return e[s].call(n.exports, n, n.exports, i), (n.l = !0), n.exports;
  }
  (i.m = e),
    (i.c = t),
    (i.d = function (e, t, s) {
      i.o(e, t) ||
        Object.defineProperty(e, t, {
          configurable: !1,
          enumerable: !0,
          get: s,
        });
    }),
    (i.r = function (e) {
      Object.defineProperty(e, "__esModule", { value: !0 });
    }),
    (i.n = function (e) {
      var t =
        e && e.__esModule
          ? function () {
              return e.default;
            }
          : function () {
              return e;
            };
      return i.d(t, "a", t), t;
    }),
    (i.o = function (e, t) {
      return Object.prototype.hasOwnProperty.call(e, t);
    }),
    (i.p = ""),
    i((i.s = 3));
})([
  function (e, t) {
    e.exports = neo4j;
  },
  function (module, exports) {
    (function () {
      (function (undefined) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        var _root = this,
          webWorkers = "Worker" in _root;
        function Supervisor(sigInst, options) {
          var _this = this,
            workerFn =
              sigInst.getForceAtlas2Worker && sigInst.getForceAtlas2Worker();
          if (
            ((options = options || {}),
            (_root.URL = _root.URL || _root.webkitURL),
            (this.sigInst = sigInst),
            (this.graph = this.sigInst.graph),
            (this.ppn = 10),
            (this.ppe = 3),
            (this.config = {}),
            (this.shouldUseWorker = !1 !== options.worker && webWorkers),
            (this.workerUrl = options.workerUrl),
            (this.started = !1),
            (this.running = !1),
            this.shouldUseWorker)
          ) {
            if (this.workerUrl) this.worker = new Worker(this.workerUrl);
            else {
              var blob = this.makeBlob(workerFn);
              this.worker = new Worker(URL.createObjectURL(blob));
            }
            this.worker.postMessage =
              this.worker.webkitPostMessage || this.worker.postMessage;
          } else eval(workerFn);
          (this.msgName = this.worker ? "message" : "newCoords"),
            (this.listener = function (e) {
              (_this.nodesByteArray = new Float32Array(e.data.nodes)),
                _this.running &&
                  (_this.applyLayoutChanges(),
                  _this.sendByteArrayToWorker(),
                  _this.sigInst.refresh());
            }),
            (this.worker || document).addEventListener(
              this.msgName,
              this.listener
            ),
            this.graphToByteArrays(),
            sigInst.bind("kill", function () {
              sigInst.killForceAtlas2();
            });
        }
        (Supervisor.prototype.makeBlob = function (e) {
          var t;
          try {
            t = new Blob([e], { type: "application/javascript" });
          } catch (i) {
            (_root.BlobBuilder =
              _root.BlobBuilder ||
              _root.WebKitBlobBuilder ||
              _root.MozBlobBuilder),
              (t = new BlobBuilder()).append(e),
              (t = t.getBlob());
          }
          return t;
        }),
          (Supervisor.prototype.graphToByteArrays = function () {
            var e,
              t,
              i,
              s = this.graph.nodes(),
              n = this.graph.edges(),
              r = s.length * this.ppn,
              a = n.length * this.ppe,
              o = {};
            for (
              this.nodesByteArray = new Float32Array(r),
                this.edgesByteArray = new Float32Array(a),
                e = t = 0,
                i = s.length;
              e < i;
              e++
            )
              (o[s[e].id] = t),
                (this.nodesByteArray[t] = s[e].x),
                (this.nodesByteArray[t + 1] = s[e].y),
                (this.nodesByteArray[t + 2] = 0),
                (this.nodesByteArray[t + 3] = 0),
                (this.nodesByteArray[t + 4] = 0),
                (this.nodesByteArray[t + 5] = 0),
                (this.nodesByteArray[t + 6] = 1 + this.graph.degree(s[e].id)),
                (this.nodesByteArray[t + 7] = 1),
                (this.nodesByteArray[t + 8] = s[e].size),
                (this.nodesByteArray[t + 9] = 0),
                (t += this.ppn);
            for (e = t = 0, i = n.length; e < i; e++)
              (this.edgesByteArray[t] = o[n[e].source]),
                (this.edgesByteArray[t + 1] = o[n[e].target]),
                (this.edgesByteArray[t + 2] = n[e].weight || 0),
                (t += this.ppe);
          }),
          (Supervisor.prototype.applyLayoutChanges = function () {
            for (
              var e = this.graph.nodes(),
                t = 0,
                i = 0,
                s = this.nodesByteArray.length;
              i < s;
              i += this.ppn
            )
              (e[t].x = this.nodesByteArray[i]),
                (e[t].y = this.nodesByteArray[i + 1]),
                t++;
          }),
          (Supervisor.prototype.sendByteArrayToWorker = function (e) {
            var t = { action: e || "loop", nodes: this.nodesByteArray.buffer },
              i = [this.nodesByteArray.buffer];
            "start" === e &&
              ((t.config = this.config || {}),
              (t.edges = this.edgesByteArray.buffer),
              i.push(this.edgesByteArray.buffer)),
              this.shouldUseWorker
                ? this.worker.postMessage(t, i)
                : _root.postMessage(t, "*");
          }),
          (Supervisor.prototype.start = function () {
            if (!this.running) {
              var e;
              for (e in ((this.running = !0), this.sigInst.cameras))
                this.sigInst.cameras[e].edgequadtree._enabled = !1;
              this.started
                ? this.sendByteArrayToWorker()
                : (this.sendByteArrayToWorker("start"), (this.started = !0));
            }
          }),
          (Supervisor.prototype.stop = function () {
            if (this.running) {
              var e, t, i;
              for (e in this.sigInst.cameras)
                ((t = this.sigInst.cameras[e]).edgequadtree._enabled = !0),
                  (i = sigma.utils.getBoundaries(this.graph, t.readPrefix)),
                  t.settings("drawEdges") &&
                    t.settings("enableEdgeHovering") &&
                    t.edgequadtree.index(this.sigInst.graph, {
                      prefix: t.readPrefix,
                      bounds: {
                        x: i.minX,
                        y: i.minY,
                        width: i.maxX - i.minX,
                        height: i.maxY - i.minY,
                      },
                    });
              this.running = !1;
            }
          }),
          (Supervisor.prototype.killWorker = function () {
            this.worker
              ? this.worker.terminate()
              : (_root.postMessage({ action: "kill" }, "*"),
                document.removeEventListener(this.msgName, this.listener));
          }),
          (Supervisor.prototype.configure = function (e) {
            if (((this.config = e), this.started)) {
              var t = { action: "config", config: this.config };
              this.shouldUseWorker
                ? this.worker.postMessage(t)
                : _root.postMessage(t, "*");
            }
          }),
          (sigma.prototype.startForceAtlas2 = function (e) {
            return (
              this.supervisor || (this.supervisor = new Supervisor(this, e)),
              e && this.supervisor.configure(e),
              this.supervisor.start(),
              this
            );
          }),
          (sigma.prototype.stopForceAtlas2 = function () {
            return this.supervisor ? (this.supervisor.stop(), this) : this;
          }),
          (sigma.prototype.killForceAtlas2 = function () {
            return this.supervisor
              ? (this.supervisor.stop(),
                this.supervisor.killWorker(),
                (this.supervisor = null),
                this)
              : this;
          }),
          (sigma.prototype.configForceAtlas2 = function (e) {
            return (
              this.supervisor || (this.supervisor = new Supervisor(this, e)),
              this.supervisor.configure(e),
              this
            );
          }),
          (sigma.prototype.isForceAtlas2Running = function (e) {
            return !!this.supervisor && this.supervisor.running;
          });
      }.call(this));
    }.call(window));
  },
  function (module, exports) {
    (function () {
      (function (undefined) {
        "use strict";
        var _root = this,
          inWebWorker = !("document" in _root),
          Worker = function (e) {
            var t,
              i,
              s,
              n = {
                ppn: 10,
                ppe: 3,
                ppr: 9,
                maxForce: 10,
                iterations: 0,
                converged: !1,
                settings: {
                  linLogMode: !1,
                  outboundAttractionDistribution: !1,
                  adjustSizes: !1,
                  edgeWeightInfluence: 0,
                  scalingRatio: 1,
                  strongGravityMode: !1,
                  gravity: 1,
                  slowDown: 1,
                  barnesHutOptimize: !1,
                  barnesHutTheta: 0.5,
                  startingIterations: 1,
                  iterationsPerRender: 1,
                },
              };
            var r,
              a = {
                x: 0,
                y: 1,
                dx: 2,
                dy: 3,
                old_dx: 4,
                old_dy: 5,
                mass: 6,
                convergence: 7,
                size: 8,
                fixed: 9,
              },
              o = { source: 0, target: 1, weight: 2 },
              d = {
                node: 0,
                centerX: 1,
                centerY: 2,
                size: 3,
                nextSibling: 4,
                firstChild: 5,
                mass: 6,
                massCenterX: 7,
                massCenterY: 8,
              };
            function h(e, t) {
              if (e % n.ppn != 0) throw "np: non correct (" + e + ").";
              if (e !== parseInt(e)) throw "np: non int.";
              if (t in a) return e + a[t];
              throw (
                "ForceAtlas2.Worker - Inexistant node property given (" +
                t +
                ")."
              );
            }
            function l(e, t) {
              if (e % n.ppe != 0) throw "ep: non correct (" + e + ").";
              if (e !== parseInt(e)) throw "ep: non int.";
              if (t in o) return e + o[t];
              throw (
                "ForceAtlas2.Worker - Inexistant edge property given (" +
                t +
                ")."
              );
            }
            function g(e, t) {
              if (e % n.ppr != 0) throw "rp: non correct (" + e + ").";
              if (e !== parseInt(e)) throw "rp: non int.";
              if (t in d) return e + d[t];
              throw (
                "ForceAtlas2.Worker - Inexistant region property given (" +
                t +
                ")."
              );
            }
            function c(e) {
              n.settings = (function () {
                var e,
                  t,
                  i = {};
                for (e = arguments.length - 1; e >= 0; e--)
                  for (t in arguments[e]) i[t] = arguments[e][t];
                return i;
              })(e, n.settings);
            }
            function u() {
              var e, r, a, o, d, c, u, m, f, p, y, x, v, b, w, E, C, k, A;
              for (a = 0; a < n.nodesLength; a += n.ppn)
                (t[h(a, "old_dx")] = t[h(a, "dx")]),
                  (t[h(a, "old_dy")] = t[h(a, "dy")]),
                  (t[h(a, "dx")] = 0),
                  (t[h(a, "dy")] = 0);
              if (n.settings.outboundAttractionDistribution) {
                for (f = 0, a = 0; a < n.nodesLength; a += n.ppn)
                  f += t[h(a, "mass")];
                f /= n.nodesLength;
              }
              if (n.settings.barnesHutOptimize) {
                var M,
                  S,
                  O = 1 / 0,
                  N = -1 / 0,
                  z = 1 / 0,
                  T = -1 / 0;
                for (s = [], a = 0; a < n.nodesLength; a += n.ppn)
                  (O = Math.min(O, t[h(a, "x")])),
                    (N = Math.max(N, t[h(a, "x")])),
                    (z = Math.min(z, t[h(a, "y")])),
                    (T = Math.max(T, t[h(a, "y")]));
                for (
                  s[g(0, "node")] = -1,
                    s[g(0, "centerX")] = (O + N) / 2,
                    s[g(0, "centerY")] = (z + T) / 2,
                    s[g(0, "size")] = Math.max(N - O, T - z),
                    s[g(0, "nextSibling")] = -1,
                    s[g(0, "firstChild")] = -1,
                    s[g(0, "mass")] = 0,
                    s[g(0, "massCenterX")] = 0,
                    s[g(0, "massCenterY")] = 0,
                    e = 1,
                    a = 0;
                  a < n.nodesLength;
                  a += n.ppn
                )
                  for (r = 0; ; )
                    if (s[g(r, "firstChild")] >= 0)
                      (M =
                        t[h(a, "x")] < s[g(r, "centerX")]
                          ? t[h(a, "y")] < s[g(r, "centerY")]
                            ? s[g(r, "firstChild")]
                            : s[g(r, "firstChild")] + n.ppr
                          : t[h(a, "y")] < s[g(r, "centerY")]
                          ? s[g(r, "firstChild")] + 2 * n.ppr
                          : s[g(r, "firstChild")] + 3 * n.ppr),
                        (s[g(r, "massCenterX")] =
                          (s[g(r, "massCenterX")] * s[g(r, "mass")] +
                            t[h(a, "x")] * t[h(a, "mass")]) /
                          (s[g(r, "mass")] + t[h(a, "mass")])),
                        (s[g(r, "massCenterY")] =
                          (s[g(r, "massCenterY")] * s[g(r, "mass")] +
                            t[h(a, "y")] * t[h(a, "mass")]) /
                          (s[g(r, "mass")] + t[h(a, "mass")])),
                        (s[g(r, "mass")] += t[h(a, "mass")]),
                        (r = M);
                    else {
                      if (s[g(r, "node")] < 0) {
                        s[g(r, "node")] = a;
                        break;
                      }
                      if (
                        ((s[g(r, "firstChild")] = e * n.ppr),
                        (u = s[g(r, "size")] / 2),
                        (m = s[g(r, "firstChild")]),
                        (s[g(m, "node")] = -1),
                        (s[g(m, "centerX")] = s[g(r, "centerX")] - u),
                        (s[g(m, "centerY")] = s[g(r, "centerY")] - u),
                        (s[g(m, "size")] = u),
                        (s[g(m, "nextSibling")] = m + n.ppr),
                        (s[g(m, "firstChild")] = -1),
                        (s[g(m, "mass")] = 0),
                        (s[g(m, "massCenterX")] = 0),
                        (s[g(m, "massCenterY")] = 0),
                        (m += n.ppr),
                        (s[g(m, "node")] = -1),
                        (s[g(m, "centerX")] = s[g(r, "centerX")] - u),
                        (s[g(m, "centerY")] = s[g(r, "centerY")] + u),
                        (s[g(m, "size")] = u),
                        (s[g(m, "nextSibling")] = m + n.ppr),
                        (s[g(m, "firstChild")] = -1),
                        (s[g(m, "mass")] = 0),
                        (s[g(m, "massCenterX")] = 0),
                        (s[g(m, "massCenterY")] = 0),
                        (m += n.ppr),
                        (s[g(m, "node")] = -1),
                        (s[g(m, "centerX")] = s[g(r, "centerX")] + u),
                        (s[g(m, "centerY")] = s[g(r, "centerY")] - u),
                        (s[g(m, "size")] = u),
                        (s[g(m, "nextSibling")] = m + n.ppr),
                        (s[g(m, "firstChild")] = -1),
                        (s[g(m, "mass")] = 0),
                        (s[g(m, "massCenterX")] = 0),
                        (s[g(m, "massCenterY")] = 0),
                        (m += n.ppr),
                        (s[g(m, "node")] = -1),
                        (s[g(m, "centerX")] = s[g(r, "centerX")] + u),
                        (s[g(m, "centerY")] = s[g(r, "centerY")] + u),
                        (s[g(m, "size")] = u),
                        (s[g(m, "nextSibling")] = s[g(r, "nextSibling")]),
                        (s[g(m, "firstChild")] = -1),
                        (s[g(m, "mass")] = 0),
                        (s[g(m, "massCenterX")] = 0),
                        (s[g(m, "massCenterY")] = 0),
                        (e += 4),
                        (M =
                          t[h(s[g(r, "node")], "x")] < s[g(r, "centerX")]
                            ? t[h(s[g(r, "node")], "y")] < s[g(r, "centerY")]
                              ? s[g(r, "firstChild")]
                              : s[g(r, "firstChild")] + n.ppr
                            : t[h(s[g(r, "node")], "y")] < s[g(r, "centerY")]
                            ? s[g(r, "firstChild")] + 2 * n.ppr
                            : s[g(r, "firstChild")] + 3 * n.ppr),
                        (s[g(r, "mass")] = t[h(s[g(r, "node")], "mass")]),
                        (s[g(r, "massCenterX")] = t[h(s[g(r, "node")], "x")]),
                        (s[g(r, "massCenterY")] = t[h(s[g(r, "node")], "y")]),
                        (s[g(M, "node")] = s[g(r, "node")]),
                        (s[g(r, "node")] = -1),
                        M !==
                          (S =
                            t[h(a, "x")] < s[g(r, "centerX")]
                              ? t[h(a, "y")] < s[g(r, "centerY")]
                                ? s[g(r, "firstChild")]
                                : s[g(r, "firstChild")] + n.ppr
                              : t[h(a, "y")] < s[g(r, "centerY")]
                              ? s[g(r, "firstChild")] + 2 * n.ppr
                              : s[g(r, "firstChild")] + 3 * n.ppr))
                      ) {
                        s[g(S, "node")] = a;
                        break;
                      }
                      r = M;
                    }
              }
              if (n.settings.barnesHutOptimize)
                for (
                  p = n.settings.scalingRatio, a = 0;
                  a < n.nodesLength;
                  a += n.ppn
                )
                  for (r = 0; ; )
                    if (s[g(r, "firstChild")] >= 0) {
                      if (
                        ((b = Math.sqrt(
                          Math.pow(t[h(a, "x")] - s[g(r, "massCenterX")], 2) +
                            Math.pow(t[h(a, "y")] - s[g(r, "massCenterY")], 2)
                        )),
                        (2 * s[g(r, "size")]) / b < n.settings.barnesHutTheta)
                      ) {
                        if (
                          ((y = t[h(a, "x")] - s[g(r, "massCenterX")]),
                          (x = t[h(a, "y")] - s[g(r, "massCenterY")]),
                          n.settings.adjustSizes
                            ? b > 0
                              ? ((w =
                                  (p * t[h(a, "mass")] * s[g(r, "mass")]) /
                                  b /
                                  b),
                                (t[h(a, "dx")] += y * w),
                                (t[h(a, "dy")] += x * w))
                              : b < 0 &&
                                ((w =
                                  (-p * t[h(a, "mass")] * s[g(r, "mass")]) / b),
                                (t[h(a, "dx")] += y * w),
                                (t[h(a, "dy")] += x * w))
                            : b > 0 &&
                              ((w =
                                (p * t[h(a, "mass")] * s[g(r, "mass")]) /
                                b /
                                b),
                              (t[h(a, "dx")] += y * w),
                              (t[h(a, "dy")] += x * w)),
                          s[g(r, "nextSibling")] < 0)
                        )
                          break;
                        r = s[g(r, "nextSibling")];
                        continue;
                      }
                      r = s[g(r, "firstChild")];
                    } else {
                      if (
                        (s[g(r, "node")] >= 0 &&
                          s[g(r, "node")] !== a &&
                          ((y = t[h(a, "x")] - t[h(s[g(r, "node")], "x")]),
                          (x = t[h(a, "y")] - t[h(s[g(r, "node")], "y")]),
                          (b = Math.sqrt(y * y + x * x)),
                          n.settings.adjustSizes
                            ? b > 0
                              ? ((w =
                                  (p *
                                    t[h(a, "mass")] *
                                    t[h(s[g(r, "node")], "mass")]) /
                                  b /
                                  b),
                                (t[h(a, "dx")] += y * w),
                                (t[h(a, "dy")] += x * w))
                              : b < 0 &&
                                ((w =
                                  (-p *
                                    t[h(a, "mass")] *
                                    t[h(s[g(r, "node")], "mass")]) /
                                  b),
                                (t[h(a, "dx")] += y * w),
                                (t[h(a, "dy")] += x * w))
                            : b > 0 &&
                              ((w =
                                (p *
                                  t[h(a, "mass")] *
                                  t[h(s[g(r, "node")], "mass")]) /
                                b /
                                b),
                              (t[h(a, "dx")] += y * w),
                              (t[h(a, "dy")] += x * w))),
                        s[g(r, "nextSibling")] < 0)
                      )
                        break;
                      r = s[g(r, "nextSibling")];
                    }
              else
                for (
                  p = n.settings.scalingRatio, o = 0;
                  o < n.nodesLength;
                  o += n.ppn
                )
                  for (d = 0; d < o; d += n.ppn)
                    (y = t[h(o, "x")] - t[h(d, "x")]),
                      (x = t[h(o, "y")] - t[h(d, "y")]),
                      n.settings.adjustSizes
                        ? (b =
                            Math.sqrt(y * y + x * x) -
                            t[h(o, "size")] -
                            t[h(d, "size")]) > 0
                          ? ((w =
                              (p * t[h(o, "mass")] * t[h(d, "mass")]) / b / b),
                            (t[h(o, "dx")] += y * w),
                            (t[h(o, "dy")] += x * w),
                            (t[h(d, "dx")] += y * w),
                            (t[h(d, "dy")] += x * w))
                          : b < 0 &&
                            ((w = 100 * p * t[h(o, "mass")] * t[h(d, "mass")]),
                            (t[h(o, "dx")] += y * w),
                            (t[h(o, "dy")] += x * w),
                            (t[h(d, "dx")] -= y * w),
                            (t[h(d, "dy")] -= x * w))
                        : (b = Math.sqrt(y * y + x * x)) > 0 &&
                          ((w =
                            (p * t[h(o, "mass")] * t[h(d, "mass")]) / b / b),
                          (t[h(o, "dx")] += y * w),
                          (t[h(o, "dy")] += x * w),
                          (t[h(d, "dx")] -= y * w),
                          (t[h(d, "dy")] -= x * w));
              for (
                m = n.settings.gravity / n.settings.scalingRatio,
                  p = n.settings.scalingRatio,
                  a = 0;
                a < n.nodesLength;
                a += n.ppn
              )
                (w = 0),
                  (y = t[h(a, "x")]),
                  (x = t[h(a, "y")]),
                  (b = Math.sqrt(Math.pow(y, 2) + Math.pow(x, 2))),
                  n.settings.strongGravityMode
                    ? b > 0 && (w = p * t[h(a, "mass")] * m)
                    : b > 0 && (w = (p * t[h(a, "mass")] * m) / b),
                  (t[h(a, "dx")] -= y * w),
                  (t[h(a, "dy")] -= x * w);
              for (
                p = 1 * (n.settings.outboundAttractionDistribution ? f : 1),
                  c = 0;
                c < n.edgesLength;
                c += n.ppe
              )
                (o = i[l(c, "source")]),
                  (d = i[l(c, "target")]),
                  (u = i[l(c, "weight")]),
                  (v = Math.pow(u, n.settings.edgeWeightInfluence)),
                  (y = t[h(o, "x")] - t[h(d, "x")]),
                  (x = t[h(o, "y")] - t[h(d, "y")]),
                  n.settings.adjustSizes
                    ? ((b = Math.sqrt(
                        Math.pow(y, 2) +
                          Math.pow(x, 2) -
                          t[h(o, "size")] -
                          t[h(d, "size")]
                      )),
                      n.settings.linLogMode
                        ? n.settings.outboundAttractionDistribution
                          ? b > 0 &&
                            (w =
                              (-p * v * Math.log(1 + b)) / b / t[h(o, "mass")])
                          : b > 0 && (w = (-p * v * Math.log(1 + b)) / b)
                        : n.settings.outboundAttractionDistribution
                        ? b > 0 && (w = (-p * v) / t[h(o, "mass")])
                        : b > 0 && (w = -p * v))
                    : ((b = Math.sqrt(Math.pow(y, 2) + Math.pow(x, 2))),
                      n.settings.linLogMode
                        ? n.settings.outboundAttractionDistribution
                          ? b > 0 &&
                            (w =
                              (-p * v * Math.log(1 + b)) / b / t[h(o, "mass")])
                          : b > 0 && (w = (-p * v * Math.log(1 + b)) / b)
                        : n.settings.outboundAttractionDistribution
                        ? ((b = 1), (w = (-p * v) / t[h(o, "mass")]))
                        : ((b = 1), (w = -p * v))),
                  b > 0 &&
                    ((t[h(o, "dx")] += y * w),
                    (t[h(o, "dy")] += x * w),
                    (t[h(d, "dx")] -= y * w),
                    (t[h(d, "dy")] -= x * w));
              if (n.settings.adjustSizes)
                for (a = 0; a < n.nodesLength; a += n.ppn)
                  t[h(a, "fixed")] ||
                    ((E = Math.sqrt(
                      Math.pow(t[h(a, "dx")], 2) + Math.pow(t[h(a, "dy")], 2)
                    )) > n.maxForce &&
                      ((t[h(a, "dx")] = (t[h(a, "dx")] * n.maxForce) / E),
                      (t[h(a, "dy")] = (t[h(a, "dy")] * n.maxForce) / E)),
                    (C =
                      t[h(a, "mass")] *
                      Math.sqrt(
                        (t[h(a, "old_dx")] - t[h(a, "dx")]) *
                          (t[h(a, "old_dx")] - t[h(a, "dx")]) +
                          (t[h(a, "old_dy")] - t[h(a, "dy")]) *
                            (t[h(a, "old_dy")] - t[h(a, "dy")])
                      )),
                    (k =
                      Math.sqrt(
                        (t[h(a, "old_dx")] + t[h(a, "dx")]) *
                          (t[h(a, "old_dx")] + t[h(a, "dx")]) +
                          (t[h(a, "old_dy")] + t[h(a, "dy")]) *
                            (t[h(a, "old_dy")] + t[h(a, "dy")])
                      ) / 2),
                    (A = (0.1 * Math.log(1 + k)) / (1 + Math.sqrt(C))),
                    (t[h(a, "x")] =
                      t[h(a, "x")] + t[h(a, "dx")] * (A / n.settings.slowDown)),
                    (t[h(a, "y")] =
                      t[h(a, "y")] +
                      t[h(a, "dy")] * (A / n.settings.slowDown)));
              else
                for (a = 0; a < n.nodesLength; a += n.ppn)
                  t[h(a, "fixed")] ||
                    ((C =
                      t[h(a, "mass")] *
                      Math.sqrt(
                        (t[h(a, "old_dx")] - t[h(a, "dx")]) *
                          (t[h(a, "old_dx")] - t[h(a, "dx")]) +
                          (t[h(a, "old_dy")] - t[h(a, "dy")]) *
                            (t[h(a, "old_dy")] - t[h(a, "dy")])
                      )),
                    (k =
                      Math.sqrt(
                        (t[h(a, "old_dx")] + t[h(a, "dx")]) *
                          (t[h(a, "old_dx")] + t[h(a, "dx")]) +
                          (t[h(a, "old_dy")] + t[h(a, "dy")]) *
                            (t[h(a, "old_dy")] + t[h(a, "dy")])
                      ) / 2),
                    (A =
                      (t[h(a, "convergence")] * Math.log(1 + k)) /
                      (1 + Math.sqrt(C))),
                    (t[h(a, "convergence")] = Math.min(
                      1,
                      Math.sqrt(
                        (A *
                          (Math.pow(t[h(a, "dx")], 2) +
                            Math.pow(t[h(a, "dy")], 2))) /
                          (1 + Math.sqrt(C))
                      )
                    )),
                    (t[h(a, "x")] =
                      t[h(a, "x")] + t[h(a, "dx")] * (A / n.settings.slowDown)),
                    (t[h(a, "y")] =
                      t[h(a, "y")] +
                      t[h(a, "dy")] * (A / n.settings.slowDown)));
              n.iterations++;
            }
            function m(e) {
              for (var t = 0; t < e; t++) u();
              r();
            }
            r =
              "undefined" != typeof window && window.document
                ? function () {
                    var e;
                    document.createEvent
                      ? (e = document.createEvent("Event")).initEvent(
                          "newCoords",
                          !0,
                          !1
                        )
                      : ((e = document.createEventObject()).eventType =
                          "newCoords"),
                      (e.eventName = "newCoords"),
                      (e.data = { nodes: t.buffer }),
                      requestAnimationFrame(function () {
                        document.dispatchEvent(e);
                      });
                  }
                : function () {
                    self.postMessage({ nodes: t.buffer }, [t.buffer]);
                  };
            var f = function (e) {
              switch (e.data.action) {
                case "start":
                  (r = new Float32Array(e.data.nodes)),
                    (a = new Float32Array(e.data.edges)),
                    (o = (o = e.data.config) || {}),
                    (t = r),
                    (i = a),
                    (n.nodesLength = t.length),
                    (n.edgesLength = i.length),
                    c(o),
                    m(n.settings.startingIterations);
                  break;
                case "loop":
                  (t = new Float32Array(e.data.nodes)),
                    m(n.settings.iterationsPerRender);
                  break;
                case "config":
                  c(e.data.config);
                  break;
                case "kill":
                  !(function (e) {
                    var t;
                    for (t in e)
                      ("hasOwnProperty" in e && !e.hasOwnProperty(t)) ||
                        delete e[t];
                  })(n),
                    (t = null),
                    (i = null),
                    (s = null),
                    self.removeEventListener("message", f);
              }
              var r, a, o;
            };
            self.addEventListener("message", f);
          };
        function crush(e) {
          var t,
            i,
            s,
            n = [
              "x",
              "y",
              "dx",
              "dy",
              "old_dx",
              "old_dy",
              "mass",
              "convergence",
              "size",
              "fixed",
            ],
            r = ["source", "target", "weight"],
            a = [
              "node",
              "centerX",
              "centerY",
              "size",
              "nextSibling",
              "firstChild",
              "mass",
              "massCenterX",
              "massCenterY",
            ];
          for (i = 0, s = a.length; i < s; i++)
            (t = new RegExp("rp\\(([^,]*), '" + a[i] + "'\\)", "g")),
              (e = e.replace(t, 0 === i ? "$1" : "$1 + " + i));
          for (i = 0, s = n.length; i < s; i++)
            (t = new RegExp("np\\(([^,]*), '" + n[i] + "'\\)", "g")),
              (e = e.replace(t, 0 === i ? "$1" : "$1 + " + i));
          for (i = 0, s = r.length; i < s; i++)
            (t = new RegExp("ep\\(([^,]*), '" + r[i] + "'\\)", "g")),
              (e = e.replace(t, 0 === i ? "$1" : "$1 + " + i));
          return e;
        }
        function getWorkerFn() {
          return (
            ";(" +
            (crush ? crush(Worker.toString()) : Worker.toString()) +
            ").call(this);"
          );
        }
        if (inWebWorker) eval(getWorkerFn());
        else {
          if ("undefined" == typeof sigma) throw "sigma is not declared";
          sigma.prototype.getForceAtlas2Worker = getWorkerFn;
        }
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    "use strict";
    i.r(t);
    i(37),
      i(36),
      i(35),
      i(34),
      i(33),
      i(32),
      i(31),
      i(30),
      i(29),
      i(28),
      i(27),
      i(26),
      i(25),
      i(24),
      i(23),
      i(22),
      i(21),
      i(20),
      i(19),
      i(18),
      i(17),
      i(16),
      i(15),
      i(14),
      i(13),
      i(2),
      i(1),
      i(12),
      i(11),
      i(10),
      i(9),
      i(8),
      i(7),
      i(6),
      i(5),
      i(4);
    var s = i(0),
      n = i.n(s);
    class r {
      constructor(e, t) {
        (this.style = t),
          null == e.driver && (e.driver = {}),
          (this.driver = n.a.driver(
            e.url,
            n.a.auth.basic(e.user, e.password),
            e.driver
          ));
      }
      _convertParams(e) {
        var t = {};
        return (
          Object.keys(e).map((i) => {
            var s = e[i];
            null != e[i] && Number.isFinite(e[i]) && (s = n.a.int(e[i])),
              (t[i] = s);
          }),
          t
        );
      }
      _neo4jToSigmaNode(e) {
        var t = {
          id: e.identity.toString(),
          labels: e.labels,
          properties: e.properties,
          x: Math.random(),
          y: Math.random(),
          size: 5,
          color: "#000",
          label: e.identity.toString(),
        };
        return (
          t.labels.forEach((e) => {
            if (this.style.labels) {
              let i = this.style.labels[e];
              i &&
                ((t.size = i.size || 5),
                (t.color = i.color || "#000"),
                i.icon && (t.icon = i.icon),
                i.type && (t.type = i.type),
                (t.type = i.type || "circle"),
                i.label &&
                  t.properties[i.label] &&
                  (t.label = t.properties[i.label]));
            }
          }),
          t
        );
      }
      _neo4jToSigmaEdge(e) {
        var t = {
          id: e.identity.toString(),
          rel_type: e.type,
          source: e.start.toString(),
          target: e.end.toString(),
          properties: e.properties,
          size: 2,
          color: "#000",
          label: e.type,
          type: "paracurve",
        };
        if (this.style.edges) {
          let e = this.style.edges[t.rel_type];
          e &&
            ((t.size = e.size || 2),
            (t.color = e.color || "#000"),
            (t.type = e.type || "paracurve"),
            e.label &&
              t.properties[e.label] &&
              (t.label = t.properties[e.label]));
        }
        return t;
      }
      graph(e, t = {}) {
        let i = this._convertParams(t),
          s = this.driver.session();
        return new Promise((t, n) => {
          s.run(e, i)
            .then(
              (e) => {
                let i = { nodes: [], edges: [] },
                  s = [],
                  n = [];
                e.records.forEach((e) => {
                  e.forEach((e, t) => {
                    e &&
                      e.hasOwnProperty("labels") &&
                      -1 === s.indexOf(e.identity.toString()) &&
                      (i.nodes.push(this._neo4jToSigmaNode(e)),
                      s.push(e.identity.toString())),
                      e &&
                        e.hasOwnProperty("type") &&
                        -1 === n.indexOf(e.identity.toString()) &&
                        (i.edges.push(this._neo4jToSigmaEdge(e)),
                        n.push(e.identity.toString())),
                      e &&
                        e.hasOwnProperty("segments") &&
                        e.segments.forEach((t) => {
                          -1 === s.indexOf(t.start.identity.toString()) &&
                            (i.nodes.push(this._neo4jToSigmaNode(t.start)),
                            s.push(t.start.identity.toString())),
                            -1 === s.indexOf(t.end.identity.toString()) &&
                              (i.nodes.push(this._neo4jToSigmaNode(t.end)),
                              s.push(t.end.identity.toString())),
                            -1 === n.indexOf(e.identity.toString()) &&
                              (i.edges.push(this._neo4jToSigmaEdge(t.rel)),
                              n.push(t.rel.identity.toString()));
                        });
                  });
                }),
                  t(i);
              },
              (e) => {
                n(e);
              }
            )
            .catch((e) => {
              n(e);
            });
        });
      }
    }
    window.Neo4jGraph = function (e, t, i, s) {
      return new r(e, t).graph(i, s);
    };
  },
  function (e, t) {
    (function () {
      (function () {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.plugins");
        var e = 0,
          t = {};
        function i(e) {
          if (t[e]) return t[e];
          var i = [0, 0, 0];
          return (
            e.match(/^#/)
              ? (i =
                  3 === (e = (e || "").replace(/^#/, "")).length
                    ? [
                        parseInt(e.charAt(0) + e.charAt(0), 16),
                        parseInt(e.charAt(1) + e.charAt(1), 16),
                        parseInt(e.charAt(2) + e.charAt(2), 16),
                      ]
                    : [
                        parseInt(e.charAt(0) + e.charAt(1), 16),
                        parseInt(e.charAt(2) + e.charAt(3), 16),
                        parseInt(e.charAt(4) + e.charAt(5), 16),
                      ])
              : e.match(/^ *rgba? *\(/) &&
                (i = [
                  +(e = e.match(
                    /^ *rgba? *\( *([0-9]*) *, *([0-9]*) *, *([0-9]*) *(,.*)?\) *$/
                  ))[1],
                  +e[2],
                  +e[3],
                ]),
            (t[e] = { r: i[0], g: i[1], b: i[2] }),
            t[e]
          );
        }
        function s(e, t, s) {
          return (
            (e = i(e)),
            (t = i(t)),
            "rgb(" +
              [
                0 | (e.r * (1 - s) + t.r * s),
                0 | (e.g * (1 - s) + t.g * s),
                0 | (e.b * (1 - s) + t.b * s),
              ].join(",") +
              ")"
          );
        }
        (sigma.plugins.animate = function (t, i, n) {
          var r,
            a,
            o,
            d = n || {},
            h = ++e,
            l = d.duration || t.settings("animationsTime"),
            g =
              "string" == typeof d.easing
                ? sigma.utils.easings[d.easing]
                : "function" == typeof d.easing
                ? d.easing
                : sigma.utils.easings.quadraticInOut,
            c = sigma.utils.dateNow();
          for (o in ((r =
            d.nodes && d.nodes.length
              ? "object" == typeof d.nodes[0]
                ? d.nodes
                : t.graph.nodes(d.nodes)
              : t.graph.nodes()),
          (a = r.reduce(function (e, t) {
            var s;
            for (s in ((e[t.id] = {}), i)) s in t && (e[t.id][s] = t[s]);
            return e;
          }, {})),
          (t.animations = t.animations || Object.create({})),
          sigma.plugins.kill(t),
          t.cameras))
            t.cameras[o].edgequadtree._enabled = !1;
          !(function e() {
            var n = (sigma.utils.dateNow() - c) / l;
            if (n >= 1) {
              var o;
              for (o in (r.forEach(function (e) {
                for (var t in i) t in i && (e[t] = e[i[t]]);
              }),
              t.cameras))
                t.cameras[o].edgequadtree._enabled = !0;
              t.refresh(), "function" == typeof d.onComplete && d.onComplete();
            } else
              (n = g(n)),
                r.forEach(function (e) {
                  for (var t in i)
                    t in i &&
                      (t.match(/color$/)
                        ? (e[t] = s(a[e.id][t], e[i[t]], n))
                        : (e[t] = e[i[t]] * n + a[e.id][t] * (1 - n)));
                }),
                t.refresh(),
                (t.animations[h] = requestAnimationFrame(e));
          })();
        }),
          (sigma.plugins.kill = function (e) {
            for (var t in e.animations || {})
              cancelAnimationFrame(e.animations[t]);
            for (t in e.cameras) e.cameras[t].edgequadtree._enabled = !0;
          });
      }.call(window));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function () {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        function e(e, t) {
          sigma.classes.dispatcher.extend(this);
          var i = this,
            s = e,
            n = document.body,
            r = t,
            a = t.container.lastChild,
            o = t.camera,
            d = null,
            h = "",
            l = [],
            g = {},
            c = !1,
            u = !1;
          function m(e) {
            g[e.data.node.id] ||
              (l.push(e.data.node),
              (g[e.data.node.id] = !0),
              l.length &&
                !c &&
                ((d = l[l.length - 1]), a.addEventListener("mousedown", p)));
          }
          function f(e) {
            var t = l
              .map(function (e) {
                return e;
              })
              .indexOf(e.data.node);
            l.splice(t, 1),
              delete g[e.data.node.id],
              l.length && !c
                ? (d = l[l.length - 1])
                : a.removeEventListener("mousedown", p);
          }
          function p(e) {
            c = !0;
            var t = s.graph.nodes().length;
            if (d && t > 1) {
              var o, h;
              for (o in (a.removeEventListener("mousedown", p),
              n.addEventListener("mousemove", x),
              n.addEventListener("mouseup", y),
              s.cameras))
                void 0 !== (h = s.cameras[o]).edgequadtree &&
                  (h.edgequadtree._enabled = !1);
              r.settings({ mouseEnabled: !1, enableHovering: !1 }),
                s.refresh(),
                i.dispatchEvent("startdrag", {
                  node: d,
                  captor: e,
                  renderer: r,
                });
            }
          }
          function y(e) {
            var t, o;
            for (t in ((c = !1),
            a.addEventListener("mousedown", p),
            n.removeEventListener("mousemove", x),
            n.removeEventListener("mouseup", y),
            s.cameras))
              void 0 !== (o = s.cameras[t]).edgequadtree &&
                (o.edgequadtree._enabled = !0);
            r.settings({ mouseEnabled: !0, enableHovering: !0 }),
              s.refresh(),
              u && i.dispatchEvent("drop", { node: d, captor: e, renderer: r }),
              i.dispatchEvent("dragend", { node: d, captor: e, renderer: r }),
              (u = !1),
              (d = null);
          }
          function x(e) {
            if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
              clearTimeout(t);
              var t = setTimeout(n, 0);
            } else n();
            function n() {
              for (
                var t,
                  n,
                  a,
                  l =
                    ((t = r.container),
                    (n = window.getComputedStyle(t)),
                    (a = function (e) {
                      return (
                        parseInt(n.getPropertyValue(e).replace("px", "")) || 0
                      );
                    }),
                    {
                      left: t.getBoundingClientRect().left + a("padding-left"),
                      top: t.getBoundingClientRect().top + a("padding-top"),
                    }),
                  g = e.clientX - l.left,
                  c = e.clientY - l.top,
                  m = Math.cos(o.angle),
                  f = Math.sin(o.angle),
                  p = s.graph.nodes(),
                  y = [],
                  x = 0;
                x < 2;
                x++
              ) {
                var v = p[x],
                  b = {
                    x: v.x * m + v.y * f,
                    y: v.y * m - v.x * f,
                    renX: v[h + "x"],
                    renY: v[h + "y"],
                  };
                y.push(b);
              }
              if (y[0].x === y[1].x && y[0].y === y[1].y) {
                var w = 0 === y[0].renX ? 1 : y[0].renX,
                  E = 0 === y[0].renY ? 1 : y[0].renY;
                (g = (y[0].x / w) * (g - y[0].renX) + y[0].x),
                  (c = (y[0].y / E) * (c - y[0].renY) + y[0].y);
              } else {
                (w = (y[1].renX - y[0].renX) / (y[1].x - y[0].x)),
                  (E = (y[1].renY - y[0].renY) / (y[1].y - y[0].y));
                y[1].x === y[0].x && (w = E),
                  y[1].y === y[0].y && (E = w),
                  (g = (g - y[0].renX) / w + y[0].x),
                  (c = (c - y[0].renY) / E + y[0].y);
              }
              (d.x = g * m - c * f),
                (d.y = c * m + g * f),
                s.refresh(),
                (u = !0),
                i.dispatchEvent("drag", { node: d, captor: e, renderer: r });
            }
          }
          t instanceof sigma.renderers.svg && (a = t.container.firstChild),
            (h =
              t instanceof sigma.renderers.webgl
                ? t.options.prefix.substr(5)
                : t.options.prefix),
            t.bind("overNode", m),
            t.bind("outNode", f),
            t.bind("click", function (e) {
              (c = !1),
                n.removeEventListener("mousemove", x),
                n.removeEventListener("mouseup", y),
                l.length || (d = null);
            }),
            s.bind("kill", function () {
              i.unbindAll();
            }),
            (this.unbindAll = function () {
              a.removeEventListener("mousedown", p),
                n.removeEventListener("mousemove", x),
                n.removeEventListener("mouseup", y),
                r.unbind("overNode", m),
                r.unbind("outNode", f);
            });
        }
        sigma.utils.pkg("sigma.plugins");
        var t = {};
        (sigma.plugins.dragNodes = function (i, s) {
          return (
            t[i.id] || (t[i.id] = new e(i, s)),
            i.bind("kill", function () {
              sigma.plugins.killDragNodes(i);
            }),
            t[i.id]
          );
        }),
          (sigma.plugins.killDragNodes = function (i) {
            t[i.id] instanceof e && (t[i.id].unbindAll(), delete t[i.id]);
          });
      }.call(window));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma)
          throw new Error("sigma is not declared");
        sigma.classes.graph.hasMethod("getNeighbors") ||
          sigma.classes.graph.addMethod(
            "getCardinalityBetweenNodes",
            function (e, t) {
              let i = 0,
                s = this.inNeighborsIndex[e];
              s[t] && (i = Object.keys(s[t]).length);
              let n = this.outNeighborsIndex[e];
              return n[t] && (i += Object.keys(n[t]).length), i;
            }
          ),
          sigma.classes.graph.attach(
            "addEdge",
            "sigma.extend.graph.addEdge",
            function (e) {
              let t = this.getCardinalityBetweenNodes(e.source, e.target);
              this.edges(e.id).order = t;
            }
          );
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.canvas.edges.labels"),
          (sigma.canvas.edges.labels.paracurve = function (e, t, i, s, n) {
            var r = n("prefix") || "",
              a = e.hidden || !1,
              o = (e.active, e.order || 0),
              d = e.color || n("defaultEdgeColor"),
              h = e[r + "size"] || n("defaultEdgeSize"),
              l = t[r + "x"],
              g = t[r + "y"],
              c = i[r + "x"],
              u = i[r + "y"];
            if (
              !a &&
              ("string" == typeof e.label || Array.isArray(e.label)) &&
              h >= n("edgeLabelThreshold")
            ) {
              var m, f, p;
              e.label;
              if ((Array.isArray(e.label) && e.label.join(", "), t.id === i.id))
                (m = sigma.canvas.utils.getSelfLoopControlPoints(
                  l,
                  g,
                  t[r + "size"],
                  h,
                  o
                )),
                  (f = sigma.utils.getPointOnBezierCurve(
                    0.5,
                    l,
                    g,
                    c,
                    u,
                    m.x1,
                    m.y1,
                    m.x2,
                    m.y2
                  )),
                  (p = Math.atan2(1, 1));
              else {
                (m = sigma.canvas.utils.getQuadraticControlPoint(
                  l,
                  g,
                  c,
                  u,
                  h,
                  o
                )),
                  (f = sigma.utils.getPointOnQuadraticCurve(
                    0.5,
                    l,
                    g,
                    c,
                    u,
                    m.x,
                    m.y
                  ));
                var y = c - l,
                  x = u - g,
                  v = l < c ? 1 : -1;
                p = Math.atan2(x * v, y * v);
              }
              s.save();
              var b = n("defaultEdgeLabelSize");
              "fixed" !== n("edgeLabelSize") &&
                (b = b * h * Math.pow(h, -1 / n("edgeLabelSizePowRatio"))),
                (s.font = [
                  n("activeFontStyle"),
                  b + "px",
                  n("activeFont") || n("font"),
                ].join(" ")),
                (s.fillStyle = d),
                (s.textAlign = "center"),
                (s.textBaseline = "alphabetic"),
                s.translate(f.x, f.y),
                s.rotate(p),
                s.fillText(e.label, 0, -h / 2 - 3),
                s.restore();
            }
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      !(function () {
        "use strict";
        sigma.utils.pkg("sigma.canvas.edgehovers"),
          (sigma.canvas.edgehovers.paracurve = function (e, t, i, s, n) {
            ((s.shadowOffsetX = 0),
            (s.shadowOffsetY = 0),
            (s.shadowBlur = 15),
            (s.shadowColor = n("labelHoverShadowColor")),
            (sigma.canvas.edges[e.type] || sigma.canvas.edges.def)(
              e,
              t,
              i,
              s,
              n
            ),
            sigma.canvas.edges.labels) &&
              (
                sigma.canvas.edges.labels[e.type] ||
                sigma.canvas.edges.labels.def
              )(e, t, i, s, n);
            sigma.canvas.utils.resetContext(s);
          });
      })();
    }.call(window));
  },
  function (e, t) {
    (function () {
      !(function () {
        "use strict";
        sigma.utils.pkg("sigma.canvas.edges"),
          (sigma.canvas.edges.paracurve = function (e, t, i, s, n) {
            var r = n("prefix") || "",
              a = e.color || n("defaultEdgeColor"),
              o = e.hidden || !1,
              d = e.active || !1,
              h = e.order || 0,
              l = n("activeBorderColor") || "#FF0000",
              g = n("activeBorderSizeRatio") || 0.1,
              c = e[r + "size"] || n("defaultEdgeSize"),
              u = t[r + "x"],
              m = t[r + "y"],
              f = i[r + "x"],
              p = i[r + "y"];
            o ||
              (d &&
                (t.id === i.id
                  ? sigma.canvas.utils.drawSelfEdgeArrow(
                      s,
                      u,
                      m,
                      t[r + "size"],
                      l,
                      c * g,
                      h
                    )
                  : sigma.canvas.utils.drawEdgeArrow(
                      s,
                      u,
                      m,
                      f,
                      p,
                      i[r + "size"],
                      l,
                      c * g,
                      h
                    )),
              t.id === i.id
                ? sigma.canvas.utils.drawSelfEdgeArrow(
                    s,
                    u,
                    m,
                    t[r + "size"],
                    a,
                    c,
                    h
                  )
                : sigma.canvas.utils.drawEdgeArrow(
                    s,
                    u,
                    m,
                    f,
                    p,
                    i[r + "size"],
                    a,
                    c,
                    h
                  ));
          });
      })();
    }.call(window));
  },
  function (e, t) {
    (function () {
      !(function () {
        "use strict";
        sigma.utils.pkg("sigma.canvas.nodes"),
          (sigma.canvas.nodes.def = function (e, t, i) {
            var s = i("prefix") || "",
              n = e.color || i("defaultNodeColor"),
              r = e.hidden || !1,
              a = (e.active, i("activeNodeBorderColor") || "#FF0000"),
              o = i("activeNodeBorderSizeRatio") || 0.1,
              d = e[s + "x"],
              h = e[s + "y"],
              l = e[s + "size"] || i("defaultNodeSize");
            if (!r) {
              if (e.selected) {
                let e = l + 1,
                  i = e * (1 + o);
                sigma.canvas.utils.drawCircle(t, d, h, i, a),
                  sigma.canvas.utils.resetContext(t),
                  sigma.canvas.utils.drawCircle(t, d, h, e, "#FFF");
              }
              sigma.canvas.utils.drawCircle(t, d, h, l, n),
                e.icon && sigma.canvas.utils.drawNodeIcon(t, e, s),
                e.image &&
                  e.image.url &&
                  sigma.canvas.utils.drawNodeImage(t, e, s),
                sigma.canvas.utils.resetContext(t);
            }
          });
      })();
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.canvas.hovers"),
          (sigma.canvas.hovers.def = function (e, t, i) {
            var s,
              n,
              r,
              a,
              o,
              d = i("hoverFontStyle") || i("fontStyle"),
              h = i("prefix") || "",
              l = e[h + "size"],
              g =
                "fixed" === i("labelSize")
                  ? i("defaultLabelSize")
                  : i("labelSizeRatio") * l;
            (t.font =
              (d ? d + " " : "") + g + "px " + (i("hoverFont") || i("font"))),
              t.beginPath(),
              (t.fillStyle =
                "node" === i("labelHoverBGColor")
                  ? e.color || i("defaultNodeColor")
                  : i("defaultHoverLabelBGColor")),
              e.label &&
                i("labelHoverShadow") &&
                ((t.shadowOffsetX = 0),
                (t.shadowOffsetY = 0),
                (t.shadowBlur = 15),
                (t.shadowColor = i("labelHoverShadowColor"))),
              e.label &&
                "string" == typeof e.label &&
                ((s = Math.round(e[h + "x"] - g / 2 - 2)),
                (n = Math.round(e[h + "y"] - g / 2 - 2)),
                (r = Math.round(t.measureText(e.label).width + g / 2 + l + 10)),
                (a = Math.round(g + 4)),
                (o = Math.round(g / 2 + 2)),
                t.moveTo(s, n + o),
                t.arcTo(s, n, s + o, n, o),
                t.lineTo(s + r, n),
                t.lineTo(s + r, n + a),
                t.lineTo(s + o, n + a),
                t.arcTo(s, n + a, s, n + a - o, o),
                t.lineTo(s, n + o),
                t.closePath(),
                t.fill(),
                sigma.canvas.utils.resetContext(t)),
              (t.shadowOffsetX = 0),
              (t.shadowOffsetY = 0),
              (t.shadowBlur = 15),
              (t.shadowColor = i("labelHoverShadowColor")),
              (sigma.canvas.nodes[e.type] || sigma.canvas.nodes.def)(e, t, i),
              e.label &&
                "string" == typeof e.label &&
                ((t.fillStyle =
                  "node" === i("labelHoverColor")
                    ? e.color || i("defaultNodeColor")
                    : i("defaultLabelHoverColor")),
                t.fillText(
                  e.label,
                  Math.round(e[h + "x"] + l + 5),
                  Math.round(e[h + "y"] + g / 3)
                )),
              sigma.canvas.utils.resetContext(t);
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      !(function () {
        "use strict";
        sigma.utils.pkg("sigma.canvas.utils"),
          (sigma.canvas.utils.drawCircle = function (e, t, i, s, n) {
            (e.fillStyle = n),
              e.beginPath(),
              e.arc(t, i, s, 0, 2 * Math.PI, !0),
              e.closePath(),
              e.fill();
          }),
          (sigma.canvas.utils.drawNodeIcon = function (e, t, i) {
            var s = t.icon.color || "#000",
              n = t.icon.scale || 0.7,
              r = String.fromCharCode("0x" + t.icon.name) || "?",
              a = t[i + "size"],
              o = t[i + "x"],
              d = t[i + "y"],
              h = Math.round(n * a);
            e.save(),
              (e.fillStyle = s),
              (e.font = h + "px fontawesome"),
              (e.textAlign = "center"),
              (e.textBaseline = "middle"),
              e.fillText(r, o, d),
              e.restore();
          }),
          (sigma.canvas.utils.drawArrow = function (e, t, i, s, n, r, a, o) {
            (e.fillStyle = o),
              e.beginPath(),
              e.moveTo(t, i),
              e.lineTo(s, n),
              e.lineTo(r, a),
              e.lineTo(t, i),
              e.closePath(),
              e.fill();
          }),
          (sigma.canvas.utils.drawSelfEdgeArrow = function (
            e,
            t,
            i,
            s,
            n,
            r,
            a
          ) {
            var o = sigma.canvas.utils.getSelfLoopControlPoints(t, i, s, r, a);
            (e.strokeStyle = n),
              (e.lineWidth = r),
              e.beginPath(),
              e.moveTo(t, i),
              e.bezierCurveTo(o.x2, o.y2, o.x1, o.y1, t, i),
              e.stroke();
            var h = 4 * r,
              l = o.x + ((targetX - o.x) * (d - h - targetSize)) / d,
              g = o.y + ((targetY - o.y) * (d - h - targetSize)) / d,
              c = ((targetX - o.x) * h) / d,
              u = ((targetY - o.y) * h) / d;
            sigma.canvas.utils.drawArrow(
              e,
              l + c,
              g + u,
              l + 0.5 * u,
              g - 0.5 * c,
              l - 0.5 * u,
              g + 0.5 * c,
              n
            );
          }),
          (sigma.canvas.utils.drawEdgeArrow = function (
            e,
            t,
            i,
            s,
            n,
            r,
            a,
            o,
            d
          ) {
            var h = sigma.canvas.utils.getQuadraticControlPoint(
              t,
              i,
              s,
              n,
              o,
              d
            );
            (e.strokeStyle = a),
              (e.lineWidth = o),
              e.beginPath(),
              e.moveTo(t, i),
              e.quadraticCurveTo(h.x, h.y, s, n),
              e.stroke();
            var l = Math.sqrt(Math.pow(s - h.x, 2) + Math.pow(n - h.y, 2)),
              g = 4 * o,
              c = h.x + ((s - h.x) * (l - g - r)) / l,
              u = h.y + ((n - h.y) * (l - g - r)) / l,
              m = ((s - h.x) * g) / l,
              f = ((n - h.y) * g) / l;
            sigma.canvas.utils.drawArrow(
              e,
              c + m,
              u + f,
              c + 0.5 * f,
              u - 0.5 * m,
              c - 0.5 * f,
              u + 0.5 * m,
              a
            );
          }),
          (sigma.canvas.utils.resetContext = function (e) {
            (e.shadowOffsetX = 0),
              (e.shadowOffsetY = 0),
              (e.shadowBlur = 0),
              (e.shadowColor = 0),
              (e.fillStyle = "#000");
          }),
          (sigma.canvas.utils.getQuadraticControlPoint = function (
            e,
            t,
            i,
            s,
            n,
            r
          ) {
            return {
              x:
                (e + i) / 2 +
                (s - t) / (60 / (5 + (r = r || 0) * Math.log(n + 1) * 5)),
              y: (t + s) / 2 + (e - i) / (60 / (5 + r * Math.log(n + 1) * 5)),
            };
          }),
          (sigma.canvas.utils.getSelfLoopControlPoints = function (
            e,
            t,
            i,
            s,
            n
          ) {
            return {
              x1: e - i * ((n = n || 0) + 1) * Math.log(s + 1),
              y1: t,
              x2: e,
              y2: t + i * (n + 1) * Math.log(s + 1),
            };
          });
      })();
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.misc"),
          (sigma.misc.drawHovers = function (e) {
            var t = this,
              i = {},
              s = {};
            function n() {
              var n,
                r,
                a,
                o,
                d,
                h = t.contexts.hover.canvas,
                l = t.settings("defaultNodeType"),
                g = t.settings("defaultEdgeType"),
                c = sigma.canvas.hovers,
                u = sigma.canvas.edgehovers,
                m = sigma.canvas.extremities,
                f = t.settings.embedObjects({ prefix: e });
              if (
                (t.contexts.hover.clearRect(0, 0, h.width, h.height),
                f("enableHovering") &&
                  f("singleHover") &&
                  Object.keys(i).length &&
                  (c[(o = i[Object.keys(i)[0]]).type] || c[l] || c.def)(
                    o,
                    t.contexts.hover,
                    f
                  ),
                f("enableHovering") && !f("singleHover"))
              )
                for (n in i)
                  (c[i[n].type] || c[l] || c.def)(i[n], t.contexts.hover, f);
              if (
                (f("enableEdgeHovering") &&
                  f("singleHover") &&
                  Object.keys(s).length &&
                  ((d = s[Object.keys(s)[0]]),
                  (r = t.graph.nodes(d.source)),
                  (a = t.graph.nodes(d.target)),
                  d.hidden ||
                    ((u[d.type] || u[g] || u.def)(d, r, a, t.contexts.hover, f),
                    f("edgeHoverExtremities")
                      ? (m[d.type] || m.def)(d, r, a, t.contexts.hover, f)
                      : ((sigma.canvas.nodes[r.type] || sigma.canvas.nodes.def)(
                          r,
                          t.contexts.hover,
                          f
                        ),
                        (sigma.canvas.nodes[a.type] || sigma.canvas.nodes.def)(
                          a,
                          t.contexts.hover,
                          f
                        )))),
                f("enableEdgeHovering") && !f("singleHover"))
              )
                for (n in s)
                  (d = s[n]),
                    (r = t.graph.nodes(d.source)),
                    (a = t.graph.nodes(d.target)),
                    d.hidden ||
                      ((u[d.type] || u[g] || u.def)(
                        d,
                        r,
                        a,
                        t.contexts.hover,
                        f
                      ),
                      f("edgeHoverExtremities")
                        ? (m[d.type] || m.def)(d, r, a, t.contexts.hover, f)
                        : ((
                            sigma.canvas.nodes[r.type] || sigma.canvas.nodes.def
                          )(r, t.contexts.hover, f),
                          (
                            sigma.canvas.nodes[a.type] || sigma.canvas.nodes.def
                          )(a, t.contexts.hover, f)));
            }
            this.bind("overNode", function (e) {
              var t = e.data.node;
              t.hidden || ((i[t.id] = t), n());
            }),
              this.bind("outNode", function (e) {
                delete i[e.data.node.id], n();
              }),
              this.bind("overEdge", function (e) {
                var t = e.data.edge;
                t.hidden || ((s[t.id] = t), n());
              }),
              this.bind("outEdge", function (e) {
                delete s[e.data.edge.id], n();
              }),
              this.bind("render", function (e) {
                n();
              });
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.misc"),
          (sigma.misc.bindDOMEvents = function (e) {
            var t = this,
              i = this.graph;
            function s(e) {
              (this.attr = function (t) {
                return e.getAttributeNS(null, t);
              }),
                (this.tag = e.tagName),
                (this.class = this.attr("class")),
                (this.id = this.attr("id")),
                (this.isNode = function () {
                  return !!~this.class.indexOf(
                    t.settings("classPrefix") + "-node"
                  );
                }),
                (this.isEdge = function () {
                  return !!~this.class.indexOf(
                    t.settings("classPrefix") + "-edge"
                  );
                }),
                (this.isHover = function () {
                  return !!~this.class.indexOf(
                    t.settings("classPrefix") + "-hover"
                  );
                });
            }
            function n(e) {
              if (t.settings("eventsEnabled")) {
                t.dispatchEvent("click", e);
                var n = new s(e.target);
                n.isNode()
                  ? t.dispatchEvent("clickNode", {
                      node: i.nodes(n.attr("data-node-id")),
                    })
                  : t.dispatchEvent("clickStage"),
                  e.preventDefault(),
                  e.stopPropagation();
              }
            }
            function r(e) {
              if (t.settings("eventsEnabled")) {
                t.dispatchEvent("doubleClick", e);
                var n = new s(e.target);
                n.isNode()
                  ? t.dispatchEvent("doubleClickNode", {
                      node: i.nodes(n.attr("data-node-id")),
                    })
                  : t.dispatchEvent("doubleClickStage"),
                  e.preventDefault(),
                  e.stopPropagation();
              }
            }
            e.addEventListener("click", n, !1),
              sigma.utils.doubleClick(e, "click", r),
              e.addEventListener("touchstart", n, !1),
              sigma.utils.doubleClick(e, "touchstart", r),
              e.addEventListener(
                "mouseover",
                function (e) {
                  var n = e.toElement || e.target;
                  if (t.settings("eventsEnabled") && n) {
                    var r = new s(n);
                    if (r.isNode())
                      t.dispatchEvent("overNode", {
                        node: i.nodes(r.attr("data-node-id")),
                      });
                    else if (r.isEdge()) {
                      var a = i.edges(r.attr("data-edge-id"));
                      t.dispatchEvent("overEdge", {
                        edge: a,
                        source: i.nodes(a.source),
                        target: i.nodes(a.target),
                      });
                    }
                  }
                },
                !0
              ),
              e.addEventListener(
                "mouseout",
                function (e) {
                  var n = e.fromElement || e.originalTarget;
                  if (t.settings("eventsEnabled")) {
                    var r = new s(n);
                    if (r.isNode())
                      t.dispatchEvent("outNode", {
                        node: i.nodes(r.attr("data-node-id")),
                      });
                    else if (r.isEdge()) {
                      var a = i.edges(r.attr("data-edge-id"));
                      t.dispatchEvent("outEdge", {
                        edge: a,
                        source: i.nodes(a.source),
                        target: i.nodes(a.target),
                      });
                    }
                  }
                },
                !0
              );
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.misc"),
          (sigma.misc.bindEvents = function (t) {
            var i,
              s,
              n,
              r,
              a = this;
            function o(e) {
              e &&
                ((n = "x" in e.data ? e.data.x : n),
                (r = "y" in e.data ? e.data.y : r));
              var i,
                s,
                o,
                d,
                h,
                l,
                g,
                c,
                u = [],
                m = n + a.width / 2,
                f = r + a.height / 2,
                p = a.camera.cameraPosition(n, r),
                y = a.camera.quadtree.point(p.x, p.y);
              if (y.length)
                for (i = 0, o = y.length; i < o; i++)
                  if (
                    ((h = (d = y[i])[t + "x"]),
                    (l = d[t + "y"]),
                    (g = d[t + "size"]),
                    !d.hidden &&
                      m > h - g &&
                      m < h + g &&
                      f > l - g &&
                      f < l + g &&
                      Math.sqrt(Math.pow(m - h, 2) + Math.pow(f - l, 2)) < g)
                  ) {
                    for (c = !1, s = 0; s < u.length; s++)
                      if (d.size > u[s].size) {
                        u.splice(s, 0, d), (c = !0);
                        break;
                      }
                    c || u.push(d);
                  }
              return u;
            }
            function d(i) {
              if (!a.settings("enableEdgeHovering")) return [];
              var s =
                sigma.renderers.canvas && a instanceof sigma.renderers.canvas;
              if (!s)
                throw new Error(
                  "The edge events feature is not compatible with the WebGL renderer"
                );
              i &&
                ((n = "x" in i.data ? i.data.x : n),
                (r = "y" in i.data ? i.data.y : r));
              var o,
                d,
                h,
                l,
                g,
                c,
                u,
                m,
                f,
                p,
                y = a.settings("edgeHoverPrecision"),
                x = {},
                v = [],
                b = n + a.width / 2,
                w = r + a.height / 2,
                E = a.camera.cameraPosition(n, r),
                C = [];
              if (s)
                for (
                  o = 0,
                    h = (l = a.camera.quadtree.area(
                      a.camera.getRectangle(a.width, a.height)
                    )).length;
                  o < h;
                  o++
                )
                  x[l[o].id] = l[o];
              function k(e, t) {
                for (p = !1, d = 0; d < e.length; d++)
                  if (t.size > e[d].size) {
                    e.splice(d, 0, t), (p = !0);
                    break;
                  }
                p || e.push(t);
              }
              if (
                (a.camera.edgequadtree !== e &&
                  (C = a.camera.edgequadtree.point(E.x, E.y)),
                C.length)
              )
                for (o = 0, h = C.length; o < h; o++)
                  (g = C[o]),
                    (u = a.graph.nodes(g.source)),
                    (m = a.graph.nodes(g.target)),
                    (c = g[t + "size"] || g["read_" + t + "size"]),
                    !g.hidden &&
                      !u.hidden &&
                      !m.hidden &&
                      (!s || x[g.source] || x[g.target]) &&
                      sigma.utils.getDistance(u[t + "x"], u[t + "y"], b, w) >
                        u[t + "size"] &&
                      sigma.utils.getDistance(m[t + "x"], m[t + "y"], b, w) >
                        m[t + "size"] &&
                      ("curve" == g.type || g.type,
                      u.id === m.id
                        ? ((f = sigma.canvas.utils.getSelfLoopControlPoints(
                            u[t + "x"],
                            u[t + "y"],
                            u[t + "size"],
                            g[t + "size"],
                            g.order
                          )),
                          sigma.utils.isPointOnBezierCurve(
                            b,
                            w,
                            u[t + "x"],
                            u[t + "y"],
                            m[t + "x"],
                            m[t + "y"],
                            f.x1,
                            f.y1,
                            f.x2,
                            f.y2,
                            Math.max(c, y)
                          ) && k(v, g))
                        : ((f = sigma.canvas.utils.getQuadraticControlPoint(
                            u[t + "x"],
                            u[t + "y"],
                            m[t + "x"],
                            m[t + "y"],
                            g[t + "size"],
                            g.order
                          )),
                          sigma.utils.isPointOnQuadraticCurve(
                            b,
                            w,
                            u[t + "x"],
                            u[t + "y"],
                            m[t + "x"],
                            m[t + "y"],
                            f.x,
                            f.y,
                            Math.max(c, y)
                          ) && k(v, g)));
              return v;
            }
            function h(e) {
              var t,
                i,
                s = {},
                n = {};
              function r(e) {
                if (a.settings("eventsEnabled")) {
                  (t = o(e)), (i = d(e));
                  var r,
                    h,
                    l,
                    g,
                    c = [],
                    u = [],
                    m = {},
                    f = t.length,
                    p = [],
                    y = [],
                    x = {},
                    v = i.length;
                  for (r = 0; r < f; r++)
                    (m[(l = t[r]).id] = l),
                      s[l.id] || (u.push(l), (s[l.id] = l));
                  for (h in s) m[h] || (c.push(s[h]), delete s[h]);
                  for (r = 0, f = u.length; r < f; r++)
                    a.dispatchEvent("overNode", { node: u[r], captor: e.data });
                  for (r = 0, f = c.length; r < f; r++)
                    a.dispatchEvent("outNode", { node: c[r], captor: e.data });
                  for (
                    u.length &&
                      a.dispatchEvent("overNodes", {
                        nodes: u,
                        captor: e.data,
                      }),
                      c.length &&
                        a.dispatchEvent("outNodes", {
                          nodes: c,
                          captor: e.data,
                        }),
                      r = 0;
                    r < v;
                    r++
                  )
                    (x[(g = i[r]).id] = g),
                      n[g.id] || (y.push(g), (n[g.id] = g));
                  for (h in n) x[h] || (p.push(n[h]), delete n[h]);
                  for (r = 0, v = y.length; r < v; r++)
                    a.dispatchEvent("overEdge", { edge: y[r], captor: e.data });
                  for (r = 0, v = p.length; r < v; r++)
                    a.dispatchEvent("outEdge", { edge: p[r], captor: e.data });
                  y.length &&
                    a.dispatchEvent("overEdges", { edges: y, captor: e.data }),
                    p.length &&
                      a.dispatchEvent("outEdges", { edges: p, captor: e.data });
                }
              }
              e.bind("click", function (e) {
                a.settings("eventsEnabled") &&
                  (a.dispatchEvent("click", e.data),
                  (t = o(e)),
                  (i = d(e)),
                  t.length
                    ? (a.dispatchEvent("clickNode", {
                        node: t[0],
                        captor: e.data,
                      }),
                      a.dispatchEvent("clickNodes", {
                        node: t,
                        captor: e.data,
                      }))
                    : i.length
                    ? (a.dispatchEvent("clickEdge", {
                        edge: i[0],
                        captor: e.data,
                      }),
                      a.dispatchEvent("clickEdges", {
                        edge: i,
                        captor: e.data,
                      }))
                    : a.dispatchEvent("clickStage", { captor: e.data }));
              }),
                e.bind("mousedown", r),
                e.bind("mouseup", r),
                e.bind("mousemove", r),
                e.bind("mouseout", function (e) {
                  if (a.settings("eventsEnabled")) {
                    var t,
                      i,
                      r,
                      o,
                      d = [],
                      h = [];
                    for (t in s) d.push(s[t]);
                    for (s = {}, i = 0, r = d.length; i < r; i++)
                      a.dispatchEvent("outNode", {
                        node: d[i],
                        captor: e.data,
                      });
                    for (
                      d.length &&
                        a.dispatchEvent("outNodes", {
                          nodes: d,
                          captor: e.data,
                        }),
                        n = {},
                        i = 0,
                        o = h.length;
                      i < o;
                      i++
                    )
                      a.dispatchEvent("outEdge", {
                        edge: h[i],
                        captor: e.data,
                      });
                    h.length &&
                      a.dispatchEvent("outEdges", { edges: h, captor: e.data });
                  }
                }),
                e.bind("doubleclick", function (e) {
                  a.settings("eventsEnabled") &&
                    (a.dispatchEvent("doubleClick", e.data),
                    (t = o(e)),
                    (i = d(e)),
                    t.length
                      ? (a.dispatchEvent("doubleClickNode", {
                          node: t[0],
                          captor: e.data,
                        }),
                        a.dispatchEvent("doubleClickNodes", {
                          node: t,
                          captor: e.data,
                        }))
                      : i.length
                      ? (a.dispatchEvent("doubleClickEdge", {
                          edge: i[0],
                          captor: e.data,
                        }),
                        a.dispatchEvent("doubleClickEdges", {
                          edge: i,
                          captor: e.data,
                        }))
                      : a.dispatchEvent("doubleClickStage", {
                          captor: e.data,
                        }));
                }),
                e.bind("rightclick", function (e) {
                  a.settings("eventsEnabled") &&
                    (a.dispatchEvent("rightClick", e.data),
                    (t = o(e)),
                    (i = d(e)),
                    t.length
                      ? (a.dispatchEvent("rightClickNode", {
                          node: t[0],
                          captor: e.data,
                        }),
                        a.dispatchEvent("rightClickNodes", {
                          node: t,
                          captor: e.data,
                        }))
                      : i.length
                      ? (a.dispatchEvent("rightClickEdge", {
                          edge: i[0],
                          captor: e.data,
                        }),
                        a.dispatchEvent("rightClickEdges", {
                          edge: i,
                          captor: e.data,
                        }))
                      : a.dispatchEvent("rightClickStage", { captor: e.data }));
                }),
                a.bind("render", r);
            }
            for (i = 0, s = this.captors.length; i < s; i++) h(this.captors[i]);
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.misc.animation.running");
        var t,
          i =
            ((t = 0),
            function () {
              return "" + ++t;
            });
        (sigma.misc.animation.camera = function (t, s, n) {
          if (!(t instanceof sigma.classes.camera && "object" == typeof s && s))
            throw "animation.camera: Wrong arguments.";
          if (
            "number" != typeof s.x &&
            "number" != typeof s.y &&
            "number" != typeof s.ratio &&
            "number" != typeof s.angle
          )
            throw "There must be at least one valid coordinate in the given val.";
          var r,
            a,
            o,
            d,
            h,
            l = n || {},
            g = sigma.utils.dateNow();
          return (
            (h = { x: t.x, y: t.y, ratio: t.ratio, angle: t.angle }),
            l.duration,
            (d =
              "function" != typeof l.easing
                ? sigma.utils.easings[l.easing || "quadraticInOut"]
                : l.easing),
            (r = function () {
              var i,
                n = l.duration ? (sigma.utils.dateNow() - g) / l.duration : 1;
              n >= 1
                ? ((t.isAnimated = !1),
                  t.goTo({
                    x: s.x !== e ? s.x : h.x,
                    y: s.y !== e ? s.y : h.y,
                    ratio: s.ratio !== e ? s.ratio : h.ratio,
                    angle: s.angle !== e ? s.angle : h.angle,
                  }),
                  cancelAnimationFrame(a),
                  delete sigma.misc.animation.running[a],
                  "function" == typeof l.onComplete && l.onComplete())
                : ((i = d(n)),
                  (t.isAnimated = !0),
                  t.goTo({
                    x: s.x !== e ? h.x + (s.x - h.x) * i : h.x,
                    y: s.y !== e ? h.y + (s.y - h.y) * i : h.y,
                    ratio:
                      s.ratio !== e
                        ? h.ratio + (s.ratio - h.ratio) * i
                        : h.ratio,
                    angle:
                      s.angle !== e
                        ? h.angle + (s.angle - h.angle) * i
                        : h.angle,
                  }),
                  "function" == typeof l.onNewFrame && l.onNewFrame(),
                  (o.frameId = requestAnimationFrame(r)));
            }),
            (a = i()),
            (o = {
              frameId: requestAnimationFrame(r),
              target: t,
              type: "camera",
              options: l,
              fn: r,
            }),
            (sigma.misc.animation.running[a] = o),
            a
          );
        }),
          (sigma.misc.animation.kill = function (e) {
            if (1 !== arguments.length || "number" != typeof e)
              throw "animation.kill: Wrong arguments.";
            var t = sigma.misc.animation.running[e];
            return (
              t &&
                (cancelAnimationFrame(e),
                delete sigma.misc.animation.running[t.frameId],
                "camera" === t.type && (t.target.isAnimated = !1),
                "function" == typeof (t.options || {}).onComplete &&
                  t.options.onComplete()),
              this
            );
          }),
          (sigma.misc.animation.killAll = function (e) {
            var t,
              i,
              s = 0,
              n = "string" == typeof e ? e : null,
              r = "object" == typeof e ? e : null,
              a = sigma.misc.animation.running;
            for (i in a)
              (n && a[i].type !== n) ||
                (r && a[i].target !== r) ||
                ((t = sigma.misc.animation.running[i]),
                cancelAnimationFrame(t.frameId),
                delete sigma.misc.animation.running[i],
                "camera" === t.type && (t.target.isAnimated = !1),
                s++,
                "function" == typeof (t.options || {}).onComplete &&
                  t.options.onComplete());
            return s;
          }),
          (sigma.misc.animation.has = function (e) {
            var t,
              i = "string" == typeof e ? e : null,
              s = "object" == typeof e ? e : null,
              n = sigma.misc.animation.running;
            for (t in n)
              if (!((i && n[t].type !== i) || (s && n[t].target !== s)))
                return !0;
            return !1;
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.middlewares"),
          (sigma.middlewares.copy = function (e, t) {
            var i, s, n;
            if (t + "" != e + "") {
              for (i = 0, s = (n = this.graph.nodes()).length; i < s; i++)
                (n[i][t + "x"] = n[i][e + "x"]),
                  (n[i][t + "y"] = n[i][e + "y"]),
                  (n[i][t + "size"] = n[i][e + "size"]);
              for (i = 0, s = (n = this.graph.edges()).length; i < s; i++)
                n[i][t + "size"] = n[i][e + "size"];
            }
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.middlewares"),
          sigma.utils.pkg("sigma.utils"),
          (sigma.middlewares.rescale = function (e, t, i) {
            var s,
              n,
              r,
              a,
              o,
              d,
              h,
              l,
              g = this.graph.nodes(),
              c = this.graph.edges(),
              u = this.settings.embedObjects(i || {}),
              m = u("bounds") || sigma.utils.getBoundaries(this.graph, e, !0),
              f = m.minX,
              p = m.minY,
              y = m.maxX,
              x = m.maxY,
              v = m.sizeMax,
              b = m.weightMax,
              w = u("width") || 1,
              E = u("height") || 1,
              C = u("autoRescale"),
              k = { nodePosition: 1, nodeSize: 1, edgeSize: 1 };
            for (
              C instanceof Array ||
                (C = ["nodePosition", "nodeSize", "edgeSize"]),
                s = 0,
                n = C.length;
              s < n;
              s++
            )
              if (!k[C[s]])
                throw new Error(
                  'The rescale setting "' + C[s] + '" is not recognized.'
                );
            var A = ~C.indexOf("nodePosition"),
              M = ~C.indexOf("nodeSize"),
              S = ~C.indexOf("edgeSize");
            for (
              h =
                "outside" === u("scalingMode")
                  ? Math.max(w / Math.max(y - f, 1), E / Math.max(x - p, 1))
                  : Math.min(w / Math.max(y - f, 1), E / Math.max(x - p, 1)),
                y += l =
                  (u("rescaleIgnoreSize") ? 0 : (u("maxNodeSize") || v) / h) +
                  (u("sideMargin") || 0),
                f -= l,
                x += l,
                p -= l,
                h =
                  "outside" === u("scalingMode")
                    ? Math.max(w / Math.max(y - f, 1), E / Math.max(x - p, 1))
                    : Math.min(w / Math.max(y - f, 1), E / Math.max(x - p, 1)),
                u("maxNodeSize") || u("minNodeSize")
                  ? u("maxNodeSize") === u("minNodeSize")
                    ? ((r = 0), (a = +u("maxNodeSize")))
                    : ((r = (u("maxNodeSize") - u("minNodeSize")) / v),
                      (a = +u("minNodeSize")))
                  : ((r = 1), (a = 0)),
                u("maxEdgeSize") || u("minEdgeSize")
                  ? u("maxEdgeSize") === u("minEdgeSize")
                    ? ((o = 0), (d = +u("minEdgeSize")))
                    : ((o = (u("maxEdgeSize") - u("minEdgeSize")) / b),
                      (d = +u("minEdgeSize")))
                  : ((o = 1), (d = 0)),
                s = 0,
                n = c.length;
              s < n;
              s++
            )
              c[s][t + "size"] = c[s][e + "size"] * (S ? o : 1) + (S ? d : 0);
            for (s = 0, n = g.length; s < n; s++)
              (g[s][t + "size"] = g[s][e + "size"] * (M ? r : 1) + (M ? a : 0)),
                (g[s][t + "x"] = (g[s][e + "x"] - (y + f) / 2) * (A ? h : 1)),
                (g[s][t + "y"] = (g[s][e + "y"] - (x + p) / 2) * (A ? h : 1));
          }),
          (sigma.utils.getBoundaries = function (e, t, i) {
            var s,
              n,
              r = e.edges(),
              a = e.nodes(),
              o = -1 / 0,
              d = -1 / 0,
              h = 1 / 0,
              l = 1 / 0,
              g = -1 / 0,
              c = -1 / 0;
            if (i)
              for (s = 0, n = r.length; s < n; s++)
                o = Math.max(r[s][t + "size"], o);
            for (s = 0, n = a.length; s < n; s++)
              (d = Math.max(a[s][t + "size"], d)),
                (g = Math.max(a[s][t + "x"], g)),
                (h = Math.min(a[s][t + "x"], h)),
                (c = Math.max(a[s][t + "y"], c)),
                (l = Math.min(a[s][t + "y"], l));
            return {
              weightMax: (o = o || 1),
              sizeMax: (d = d || 1),
              minX: h,
              minY: l,
              maxX: g,
              maxY: c,
            };
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.canvas.extremities"),
          (sigma.canvas.extremities.def = function (e, t, i, s, n) {
            (sigma.canvas.hovers[t.type] || sigma.canvas.hovers.def)(t, s, n),
              (sigma.canvas.hovers[i.type] || sigma.canvas.hovers.def)(i, s, n);
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.canvas.labels"),
          (sigma.canvas.labels.def = function (e, t, i) {
            var s,
              n = i("prefix") || "",
              r = e[n + "size"];
            r < i("labelThreshold") ||
              (e.label &&
                "string" == typeof e.label &&
                ((s =
                  "fixed" === i("labelSize")
                    ? i("defaultLabelSize")
                    : i("labelSizeRatio") * r),
                (t.font =
                  (i("fontStyle") ? i("fontStyle") + " " : "") +
                  s +
                  "px " +
                  i("font")),
                (t.fillStyle =
                  "node" === i("labelColor")
                    ? e.color || i("defaultNodeColor")
                    : i("defaultLabelColor")),
                t.fillText(
                  e.label,
                  Math.round(e[n + "x"] + r + 3),
                  Math.round(e[n + "y"] + s / 3)
                )));
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      !(function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.renderers");
        var t,
          i = !!e.WebGLRenderingContext;
        if (i) {
          t = document.createElement("canvas");
          try {
            i = !(
              !t.getContext("webgl") && !t.getContext("experimental-webgl")
            );
          } catch (e) {
            i = !1;
          }
        }
        sigma.renderers.def = i
          ? sigma.renderers.webgl
          : sigma.renderers.canvas;
      })(this);
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.renderers"),
          (sigma.renderers.webgl = function (e, t, i, s) {
            if ("object" != typeof s)
              throw "sigma.renderers.webgl: Wrong arguments.";
            if (!(s.container instanceof HTMLElement))
              throw "Container not found.";
            var n, r, a, o;
            for (
              sigma.classes.dispatcher.extend(this),
                this.jobs = {},
                Object.defineProperty(this, "conradId", {
                  value: sigma.utils.id(),
                }),
                this.graph = e,
                this.camera = t,
                this.contexts = {},
                this.domElements = {},
                this.options = s,
                this.container = this.options.container,
                this.settings =
                  "object" == typeof s.settings && s.settings
                    ? i.embedObjects(s.settings)
                    : i,
                this.options.prefix = this.camera.readPrefix,
                Object.defineProperty(this, "nodePrograms", { value: {} }),
                Object.defineProperty(this, "edgePrograms", { value: {} }),
                Object.defineProperty(this, "nodeFloatArrays", { value: {} }),
                Object.defineProperty(this, "edgeFloatArrays", { value: {} }),
                Object.defineProperty(this, "edgeIndicesArrays", { value: {} }),
                this.settings(s, "batchEdgesDrawing")
                  ? (this.initDOM("canvas", "edges", !0),
                    this.initDOM("canvas", "nodes", !0))
                  : (this.initDOM("canvas", "scene", !0),
                    (this.contexts.nodes = this.contexts.scene),
                    (this.contexts.edges = this.contexts.scene)),
                this.initDOM("canvas", "labels"),
                this.initDOM("canvas", "mouse"),
                this.contexts.hover = this.contexts.mouse,
                this.captors = [],
                n = 0,
                r = (a = this.options.captors || [
                  sigma.captors.mouse,
                  sigma.captors.touch,
                ]).length;
              n < r;
              n++
            )
              (o = "function" == typeof a[n] ? a[n] : sigma.captors[a[n]]),
                this.captors.push(
                  new o(this.domElements.mouse, this.camera, this.settings)
                );
            sigma.misc.bindEvents.call(this, this.camera.prefix),
              sigma.misc.drawHovers.call(this, this.camera.prefix),
              this.resize();
          }),
          (sigma.renderers.webgl.prototype.process = function () {
            var e,
              t,
              i,
              s,
              n,
              r,
              a = this.graph,
              o = sigma.utils.extend(o, this.options),
              d = this.settings(o, "defaultEdgeType"),
              h = this.settings(o, "defaultNodeType");
            for (s in this.nodeFloatArrays) delete this.nodeFloatArrays[s];
            for (s in this.edgeFloatArrays) delete this.edgeFloatArrays[s];
            for (s in this.edgeIndicesArrays) delete this.edgeIndicesArrays[s];
            for (t = 0, i = (e = a.edges()).length; t < i; t++)
              (s = (n = e[t].type || d) && sigma.webgl.edges[n] ? n : "def"),
                this.edgeFloatArrays[s] ||
                  (this.edgeFloatArrays[s] = { edges: [] }),
                this.edgeFloatArrays[s].edges.push(e[t]);
            for (t = 0, i = (e = a.nodes()).length; t < i; t++)
              (s = (n = e[t].type || h) && sigma.webgl.nodes[n] ? n : "def"),
                this.nodeFloatArrays[s] ||
                  (this.nodeFloatArrays[s] = { nodes: [] }),
                this.nodeFloatArrays[s].nodes.push(e[t]);
            for (s in this.edgeFloatArrays) {
              for (
                r = sigma.webgl.edges[s],
                  e = this.edgeFloatArrays[s].edges,
                  this.edgeFloatArrays[s].array = new Float32Array(
                    e.length * r.POINTS * r.ATTRIBUTES
                  ),
                  t = 0,
                  i = e.length;
                t < i;
                t++
              )
                e[t].hidden ||
                  a.nodes(e[t].source).hidden ||
                  a.nodes(e[t].target).hidden ||
                  r.addEdge(
                    e[t],
                    a.nodes(e[t].source),
                    a.nodes(e[t].target),
                    this.edgeFloatArrays[s].array,
                    t * r.POINTS * r.ATTRIBUTES,
                    o.prefix,
                    this.settings
                  );
              "function" == typeof r.computeIndices &&
                (this.edgeIndicesArrays[s] = r.computeIndices(
                  this.edgeFloatArrays[s].array
                ));
            }
            for (s in this.nodeFloatArrays)
              for (
                r = sigma.webgl.nodes[s],
                  e = this.nodeFloatArrays[s].nodes,
                  this.nodeFloatArrays[s].array = new Float32Array(
                    e.length * r.POINTS * r.ATTRIBUTES
                  ),
                  t = 0,
                  i = e.length;
                t < i;
                t++
              )
                this.nodeFloatArrays[s].array ||
                  (this.nodeFloatArrays[s].array = new Float32Array(
                    e.length * r.POINTS * r.ATTRIBUTES
                  )),
                  e[t].hidden ||
                    r.addNode(
                      e[t],
                      this.nodeFloatArrays[s].array,
                      t * r.POINTS * r.ATTRIBUTES,
                      o.prefix,
                      this.settings
                    );
            return this;
          }),
          (sigma.renderers.webgl.prototype.render = function (t) {
            var i,
              s,
              n,
              r,
              a,
              o,
              d = this,
              h = (this.graph, this.contexts.nodes),
              l = this.contexts.edges,
              g = this.camera.getMatrix(),
              c = sigma.utils.extend(t, this.options),
              u = this.settings(c, "drawLabels"),
              m = this.settings(c, "drawEdges"),
              f = this.settings(c, "drawNodes");
            for (r in (this.resize(!1),
            this.settings(c, "hideEdgesOnMove") &&
              (this.camera.isAnimated || this.camera.isMoving) &&
              (m = !1),
            this.clear(),
            (g = sigma.utils.matrices.multiply(
              g,
              sigma.utils.matrices.translation(this.width / 2, this.height / 2)
            )),
            this.jobs))
              conrad.hasJob(r) && conrad.killJob(r);
            if (m)
              if (this.settings(c, "batchEdgesDrawing"))
                (function () {
                  var e, t, i, s, n, r, a, o, d, h;
                  (i = "edges_" + this.conradId),
                    (h = this.settings(c, "webglEdgesBatchSize")),
                    (e = Object.keys(this.edgeFloatArrays)).length &&
                      ((t = 0),
                      (d = sigma.webgl.edges[e[t]]),
                      (n = this.edgeFloatArrays[e[t]].array),
                      (o = this.edgeIndicesArrays[e[t]]),
                      (a = 0),
                      (r = Math.min(a + h * d.POINTS, n.length / d.ATTRIBUTES)),
                      (s = function () {
                        return (
                          this.edgePrograms[e[t]] ||
                            (this.edgePrograms[e[t]] = d.initProgram(l)),
                          a < r &&
                            (l.useProgram(this.edgePrograms[e[t]]),
                            d.render(l, this.edgePrograms[e[t]], n, {
                              settings: this.settings,
                              matrix: g,
                              width: this.width,
                              height: this.height,
                              ratio: this.camera.ratio,
                              scalingRatio: this.settings(
                                c,
                                "webglOversamplingRatio"
                              ),
                              start: a,
                              count: r - a,
                              indicesData: o,
                            })),
                          r >= n.length / d.ATTRIBUTES && t === e.length - 1
                            ? (delete this.jobs[i], !1)
                            : (r >= n.length / d.ATTRIBUTES
                                ? (t++,
                                  (n = this.edgeFloatArrays[e[t]].array),
                                  (d = sigma.webgl.edges[e[t]]),
                                  (a = 0),
                                  (r = Math.min(
                                    a + h * d.POINTS,
                                    n.length / d.ATTRIBUTES
                                  )))
                                : ((a = r),
                                  (r = Math.min(
                                    a + h * d.POINTS,
                                    n.length / d.ATTRIBUTES
                                  ))),
                              !0)
                        );
                      }),
                      (this.jobs[i] = s),
                      conrad.addJob(i, s.bind(this)));
                }.call(this));
              else
                for (r in this.edgeFloatArrays)
                  (o = sigma.webgl.edges[r]),
                    this.edgePrograms[r] ||
                      (this.edgePrograms[r] = o.initProgram(l)),
                    this.edgeFloatArrays[r] &&
                      (l.useProgram(this.edgePrograms[r]),
                      o.render(
                        l,
                        this.edgePrograms[r],
                        this.edgeFloatArrays[r].array,
                        {
                          settings: this.settings,
                          matrix: g,
                          width: this.width,
                          height: this.height,
                          ratio: this.camera.ratio,
                          scalingRatio: this.settings(
                            c,
                            "webglOversamplingRatio"
                          ),
                          indicesData: this.edgeIndicesArrays[r],
                        }
                      ));
            if (f)
              for (r in (h.blendFunc(h.SRC_ALPHA, h.ONE_MINUS_SRC_ALPHA),
              h.enable(h.BLEND),
              this.nodeFloatArrays))
                (o = sigma.webgl.nodes[r]),
                  this.nodePrograms[r] ||
                    (this.nodePrograms[r] = o.initProgram(h)),
                  this.nodeFloatArrays[r] &&
                    (h.useProgram(this.nodePrograms[r]),
                    o.render(
                      h,
                      this.nodePrograms[r],
                      this.nodeFloatArrays[r].array,
                      {
                        settings: this.settings,
                        matrix: g,
                        width: this.width,
                        height: this.height,
                        ratio: this.camera.ratio,
                        scalingRatio: this.settings(
                          c,
                          "webglOversamplingRatio"
                        ),
                      }
                    ));
            if (u)
              for (
                i = this.camera.quadtree.area(
                  this.camera.getRectangle(this.width, this.height)
                ),
                  this.camera.applyView(e, e, {
                    nodes: i,
                    edges: [],
                    width: this.width,
                    height: this.height,
                  }),
                  a = function (e) {
                    return d.settings({ prefix: d.camera.prefix }, e);
                  },
                  s = 0,
                  n = i.length;
                s < n;
                s++
              )
                i[s].hidden ||
                  (
                    sigma.canvas.labels[
                      i[s].type || this.settings(c, "defaultNodeType")
                    ] || sigma.canvas.labels.def
                  )(i[s], this.contexts.labels, a);
            return this.dispatchEvent("render"), this;
          }),
          (sigma.renderers.webgl.prototype.initDOM = function (e, t, i) {
            var s = document.createElement(e),
              n = this;
            (s.style.position = "absolute"),
              s.setAttribute("class", "sigma-" + t),
              (this.domElements[t] = s),
              this.container.appendChild(s),
              "canvas" === e.toLowerCase() &&
                ((this.contexts[t] = s.getContext(
                  i ? "experimental-webgl" : "2d",
                  { preserveDrawingBuffer: !0 }
                )),
                i &&
                  (s.addEventListener(
                    "webglcontextlost",
                    function (e) {
                      e.preventDefault();
                    },
                    !1
                  ),
                  s.addEventListener(
                    "webglcontextrestored",
                    function (e) {
                      n.render();
                    },
                    !1
                  )));
          }),
          (sigma.renderers.webgl.prototype.resize = function (t, i) {
            var s,
              n = this.width,
              r = this.height,
              a = sigma.utils.getPixelRatio();
            if (
              (t !== e && i !== e
                ? ((this.width = t), (this.height = i))
                : ((this.width = this.container.offsetWidth),
                  (this.height = this.container.offsetHeight),
                  (t = this.width),
                  (i = this.height)),
              n !== this.width || r !== this.height)
            )
              for (s in this.domElements)
                (this.domElements[s].style.width = t + "px"),
                  (this.domElements[s].style.height = i + "px"),
                  "canvas" === this.domElements[s].tagName.toLowerCase() &&
                    (this.contexts[s] && this.contexts[s].scale
                      ? (this.domElements[s].setAttribute(
                          "width",
                          t * a + "px"
                        ),
                        this.domElements[s].setAttribute(
                          "height",
                          i * a + "px"
                        ),
                        1 !== a && this.contexts[s].scale(a, a))
                      : (this.domElements[s].setAttribute(
                          "width",
                          t * this.settings("webglOversamplingRatio") + "px"
                        ),
                        this.domElements[s].setAttribute(
                          "height",
                          i * this.settings("webglOversamplingRatio") + "px"
                        )));
            for (s in this.contexts)
              this.contexts[s] &&
                this.contexts[s].viewport &&
                this.contexts[s].viewport(
                  0,
                  0,
                  this.width * this.settings("webglOversamplingRatio"),
                  this.height * this.settings("webglOversamplingRatio")
                );
            return this;
          }),
          (sigma.renderers.webgl.prototype.clear = function () {
            return (
              this.contexts.labels.clearRect(0, 0, this.width, this.height),
              this.contexts.nodes.clear(this.contexts.nodes.COLOR_BUFFER_BIT),
              this.contexts.edges.clear(this.contexts.edges.COLOR_BUFFER_BIT),
              this
            );
          }),
          (sigma.renderers.webgl.prototype.kill = function () {
            for (var e, t; (t = this.captors.pop()); ) t.kill();
            for (e in (delete this.captors, this.domElements))
              this.domElements[e].parentNode.removeChild(this.domElements[e]),
                delete this.domElements[e],
                delete this.contexts[e];
            delete this.domElements, delete this.contexts;
          }),
          sigma.utils.pkg("sigma.webgl.nodes"),
          sigma.utils.pkg("sigma.webgl.edges"),
          sigma.utils.pkg("sigma.canvas.labels");
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        if ("undefined" == typeof conrad) throw "conrad is not declared";
        sigma.utils.pkg("sigma.renderers"),
          (sigma.renderers.svg = function (e, t, i, s) {
            if ("object" != typeof s)
              throw "sigma.renderers.svg: Wrong arguments.";
            if (!(s.container instanceof HTMLElement))
              throw "Container not found.";
            var n,
              r,
              a,
              o,
              d = this;
            for (
              sigma.classes.dispatcher.extend(this),
                this.graph = e,
                this.camera = t,
                this.domElements = {
                  graph: null,
                  groups: {},
                  nodes: {},
                  edges: {},
                  labels: {},
                  hovers: {},
                },
                this.measurementCanvas = null,
                this.options = s,
                this.container = this.options.container,
                this.settings =
                  "object" == typeof s.settings && s.settings
                    ? i.embedObjects(s.settings)
                    : i,
                this.settings("freeStyle", !!this.options.freeStyle),
                this.settings("xmlns", "http://www.w3.org/2000/svg"),
                this.nodesOnScreen = [],
                this.edgesOnScreen = [],
                this.options.prefix = "renderer" + sigma.utils.id() + ":",
                this.initDOM("svg"),
                this.captors = [],
                n = 0,
                r = (a = this.options.captors || [
                  sigma.captors.mouse,
                  sigma.captors.touch,
                ]).length;
              n < r;
              n++
            )
              (o = "function" == typeof a[n] ? a[n] : sigma.captors[a[n]]),
                this.captors.push(
                  new o(this.domElements.graph, this.camera, this.settings)
                );
            window.addEventListener("resize", function () {
              d.resize();
            }),
              sigma.misc.bindDOMEvents.call(this, this.domElements.graph),
              this.bindHovers(this.options.prefix),
              this.resize(!1);
          }),
          (sigma.renderers.svg.prototype.render = function (t) {
            t = t || {};
            var i,
              s,
              n,
              r,
              a,
              o,
              d,
              h,
              l,
              g = {},
              c = this.graph,
              u = this.graph.nodes,
              m = (this.options.prefix, this.settings(t, "drawEdges")),
              f = this.settings(t, "drawNodes"),
              p =
                (this.settings(t, "drawLabels"),
                this.settings.embedObjects(t, {
                  prefix: this.options.prefix,
                  forceLabels: this.options.forceLabels,
                }));
            for (
              this.settings(t, "hideEdgesOnMove") &&
                (this.camera.isAnimated || this.camera.isMoving) &&
                (m = !1),
                this.camera.applyView(e, this.options.prefix, {
                  width: this.width,
                  height: this.height,
                }),
                this.hideDOMElements(this.domElements.nodes),
                this.hideDOMElements(this.domElements.edges),
                this.hideDOMElements(this.domElements.labels),
                this.edgesOnScreen = [],
                this.nodesOnScreen = this.camera.quadtree.area(
                  this.camera.getRectangle(this.width, this.height)
                ),
                s = 0,
                r = (i = this.nodesOnScreen).length;
              s < r;
              s++
            )
              g[i[s].id] = i[s];
            for (s = 0, r = (i = c.edges()).length; s < r; s++)
              (!g[(a = i[s]).source] && !g[a.target]) ||
                a.hidden ||
                u(a.source).hidden ||
                u(a.target).hidden ||
                this.edgesOnScreen.push(a);
            if (((h = sigma.svg.nodes), (l = sigma.svg.labels), f))
              for (s = 0, r = (i = this.nodesOnScreen).length; s < r; s++)
                i[s].hidden ||
                  this.domElements.nodes[i[s].id] ||
                  ((n = (h[i[s].type] || h.def).create(i[s], p)),
                  (this.domElements.nodes[i[s].id] = n),
                  this.domElements.groups.nodes.appendChild(n),
                  (n = (l[i[s].type] || l.def).create(i[s], p)),
                  (this.domElements.labels[i[s].id] = n),
                  this.domElements.groups.labels.appendChild(n));
            if (f)
              for (s = 0, r = (i = this.nodesOnScreen).length; s < r; s++)
                i[s].hidden ||
                  ((h[i[s].type] || h.def).update(
                    i[s],
                    this.domElements.nodes[i[s].id],
                    p
                  ),
                  (l[i[s].type] || l.def).update(
                    i[s],
                    this.domElements.labels[i[s].id],
                    p
                  ));
            if (((h = sigma.svg.edges), m))
              for (s = 0, r = (i = this.edgesOnScreen).length; s < r; s++)
                this.domElements.edges[i[s].id] ||
                  ((o = u(i[s].source)),
                  (d = u(i[s].target)),
                  (n = (h[i[s].type] || h.def).create(i[s], o, d, p)),
                  (this.domElements.edges[i[s].id] = n),
                  this.domElements.groups.edges.appendChild(n));
            if (m)
              for (s = 0, r = (i = this.edgesOnScreen).length; s < r; s++)
                (o = u(i[s].source)),
                  (d = u(i[s].target)),
                  (h[i[s].type] || h.def).update(
                    i[s],
                    this.domElements.edges[i[s].id],
                    o,
                    d,
                    p
                  );
            return this.dispatchEvent("render"), this;
          }),
          (sigma.renderers.svg.prototype.initDOM = function (e) {
            var t,
              i,
              s,
              n = document.createElementNS(this.settings("xmlns"), e),
              r = this.settings("classPrefix");
            (n.style.position = "absolute"),
              n.setAttribute("class", r + "-svg"),
              n.setAttribute("xmlns", this.settings("xmlns")),
              n.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink"),
              n.setAttribute("version", "1.1");
            var a = document.createElement("canvas");
            a.setAttribute("class", r + "-measurement-canvas"),
              (this.domElements.graph = this.container.appendChild(n));
            var o = ["edges", "nodes", "labels", "hovers"];
            for (s = 0, i = o.length; s < i; s++)
              (t = document.createElementNS(
                this.settings("xmlns"),
                "g"
              )).setAttributeNS(null, "id", r + "-group-" + o[s]),
                t.setAttributeNS(null, "class", r + "-group"),
                (this.domElements.groups[o[s]] =
                  this.domElements.graph.appendChild(t));
            this.container.appendChild(a),
              (this.measurementCanvas = a.getContext("2d"));
          }),
          (sigma.renderers.svg.prototype.hideDOMElements = function (e) {
            var t, i;
            for (i in e) (t = e[i]), sigma.svg.utils.hide(t);
            return this;
          }),
          (sigma.renderers.svg.prototype.bindHovers = function (e) {
            var t,
              i = sigma.svg.hovers,
              s = this;
            this.bind("overNode", function (n) {
              var r = n.data.node,
                a = s.settings.embedObjects({ prefix: e });
              if (a("enableHovering")) {
                var o = (i[r.type] || i.def).create(
                  r,
                  s.domElements.nodes[r.id],
                  s.measurementCanvas,
                  a
                );
                (s.domElements.hovers[r.id] = o),
                  s.domElements.groups.hovers.appendChild(o),
                  (t = r);
              }
            }),
              this.bind("outNode", function (i) {
                var n = i.data.node;
                s.settings.embedObjects({ prefix: e })("enableHovering") &&
                  (s.domElements.groups.hovers.removeChild(
                    s.domElements.hovers[n.id]
                  ),
                  (t = null),
                  delete s.domElements.hovers[n.id],
                  s.domElements.groups.nodes.appendChild(
                    s.domElements.nodes[n.id]
                  ));
              }),
              this.bind("render", function () {
                if (t) {
                  var n = s.settings.embedObjects({ prefix: e });
                  s.domElements.groups.hovers.removeChild(
                    s.domElements.hovers[t.id]
                  ),
                    delete s.domElements.hovers[t.id];
                  var r = (i[t.type] || i.def).create(
                    t,
                    s.domElements.nodes[t.id],
                    s.measurementCanvas,
                    n
                  );
                  (s.domElements.hovers[t.id] = r),
                    s.domElements.groups.hovers.appendChild(r);
                }
              });
          }),
          (sigma.renderers.svg.prototype.resize = function (t, i) {
            var s = this.width,
              n = this.height;
            return (
              t !== e && i !== e
                ? ((this.width = t), (this.height = i))
                : ((this.width = this.container.offsetWidth),
                  (this.height = this.container.offsetHeight),
                  (t = this.width),
                  (i = this.height)),
              (s === this.width && n === this.height) ||
                ((this.domElements.graph.style.width = t + "px"),
                (this.domElements.graph.style.height = i + "px"),
                "svg" === this.domElements.graph.tagName.toLowerCase() &&
                  (this.domElements.graph.setAttribute("width", 1 * t),
                  this.domElements.graph.setAttribute("height", 1 * i))),
              this
            );
          }),
          sigma.utils.pkg("sigma.svg.nodes"),
          sigma.utils.pkg("sigma.svg.edges"),
          sigma.utils.pkg("sigma.svg.labels");
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        if ("undefined" == typeof conrad) throw "conrad is not declared";
        sigma.utils.pkg("sigma.renderers"),
          (sigma.renderers.canvas = function (e, t, i, s) {
            if ("object" != typeof s)
              throw "sigma.renderers.canvas: Wrong arguments.";
            if (!(s.container instanceof HTMLElement))
              throw "Container not found.";
            var n, r, a, o;
            for (
              sigma.classes.dispatcher.extend(this),
                Object.defineProperty(this, "conradId", {
                  value: sigma.utils.id(),
                }),
                this.graph = e,
                this.camera = t,
                this.contexts = {},
                this.domElements = {},
                this.options = s,
                this.container = this.options.container,
                this.settings =
                  "object" == typeof s.settings && s.settings
                    ? i.embedObjects(s.settings)
                    : i,
                this.nodesOnScreen = [],
                this.edgesOnScreen = [],
                this.jobs = {},
                this.options.prefix = "renderer" + this.conradId + ":",
                this.settings("batchEdgesDrawing")
                  ? (this.initDOM("canvas", "edges"),
                    this.initDOM("canvas", "scene"),
                    (this.contexts.nodes = this.contexts.scene),
                    (this.contexts.labels = this.contexts.scene))
                  : (this.initDOM("canvas", "scene"),
                    (this.contexts.edges = this.contexts.scene),
                    (this.contexts.nodes = this.contexts.scene),
                    (this.contexts.labels = this.contexts.scene)),
                this.initDOM("canvas", "mouse"),
                this.contexts.hover = this.contexts.mouse,
                this.captors = [],
                n = 0,
                r = (a = this.options.captors || [
                  sigma.captors.mouse,
                  sigma.captors.touch,
                ]).length;
              n < r;
              n++
            )
              (o = "function" == typeof a[n] ? a[n] : sigma.captors[a[n]]),
                this.captors.push(
                  new o(this.domElements.mouse, this.camera, this.settings)
                );
            sigma.misc.bindEvents.call(this, this.options.prefix),
              sigma.misc.drawHovers.call(this, this.options.prefix),
              this.resize(!1);
          }),
          (sigma.renderers.canvas.prototype.render = function (t) {
            t = t || {};
            var i,
              s,
              n,
              r,
              a,
              o,
              d,
              h,
              l,
              g,
              c,
              u,
              m,
              f = {},
              p = this.graph,
              y = this.graph.nodes,
              x = (this.options.prefix, this.settings(t, "drawEdges")),
              v = this.settings(t, "drawNodes"),
              b = this.settings(t, "drawLabels"),
              w = this.settings(t, "drawEdgeLabels"),
              E = this.settings.embedObjects(t, {
                prefix: this.options.prefix,
              });
            for (n in (this.resize(!1),
            this.settings(t, "hideEdgesOnMove") &&
              (this.camera.isAnimated || this.camera.isMoving) &&
              (x = !1),
            this.camera.applyView(e, this.options.prefix, {
              width: this.width,
              height: this.height,
            }),
            this.clear(),
            this.jobs))
              conrad.hasJob(n) && conrad.killJob(n);
            for (
              this.edgesOnScreen = [],
                this.nodesOnScreen = this.camera.quadtree.area(
                  this.camera.getRectangle(this.width, this.height)
                ),
                i = this.nodesOnScreen,
                s = 0,
                r = i.length;
              s < r;
              s++
            )
              f[i[s].id] = i[s];
            if (x) {
              for (i = p.edges(), s = 0, r = i.length; s < r; s++)
                (!f[(a = i[s]).source] && !f[a.target]) ||
                  a.hidden ||
                  y(a.source).hidden ||
                  y(a.target).hidden ||
                  this.edgesOnScreen.push(a);
              if (this.settings(t, "batchEdgesDrawing"))
                (o = "edges_" + this.conradId),
                  (u = E("canvasEdgesBatchSize")),
                  (r = (g = this.edgesOnScreen).length),
                  (l = 0),
                  (d = Math.min(g.length, l + u)),
                  (h = function () {
                    for (
                      m = this.contexts.edges.globalCompositeOperation,
                        this.contexts.edges.globalCompositeOperation =
                          "destination-over",
                        c = sigma.canvas.edges,
                        s = l;
                      s < d;
                      s++
                    )
                      (a = g[s]),
                        (
                          c[a.type || this.settings(t, "defaultEdgeType")] ||
                          c.def
                        )(
                          a,
                          p.nodes(a.source),
                          p.nodes(a.target),
                          this.contexts.edges,
                          E
                        );
                    if (w)
                      for (c = sigma.canvas.edges.labels, s = l; s < d; s++)
                        (a = g[s]).hidden ||
                          (
                            c[a.type || this.settings(t, "defaultEdgeType")] ||
                            c.def
                          )(
                            a,
                            p.nodes(a.source),
                            p.nodes(a.target),
                            this.contexts.labels,
                            E
                          );
                    return (
                      (this.contexts.edges.globalCompositeOperation = m),
                      d === g.length
                        ? (delete this.jobs[o], !1)
                        : ((l = d + 1), (d = Math.min(g.length, l + u)), !0)
                    );
                  }),
                  (this.jobs[o] = h),
                  conrad.addJob(o, h.bind(this));
              else {
                for (
                  c = sigma.canvas.edges,
                    i = this.edgesOnScreen,
                    s = 0,
                    r = i.length;
                  s < r;
                  s++
                )
                  (a = i[s]),
                    (c[a.type || this.settings(t, "defaultEdgeType")] || c.def)(
                      a,
                      p.nodes(a.source),
                      p.nodes(a.target),
                      this.contexts.edges,
                      E
                    );
                if (w)
                  for (
                    c = sigma.canvas.edges.labels,
                      i = this.edgesOnScreen,
                      s = 0,
                      r = i.length;
                    s < r;
                    s++
                  )
                    i[s].hidden ||
                      (
                        c[i[s].type || this.settings(t, "defaultEdgeType")] ||
                        c.def
                      )(
                        i[s],
                        p.nodes(i[s].source),
                        p.nodes(i[s].target),
                        this.contexts.labels,
                        E
                      );
              }
            }
            if (v)
              for (
                c = sigma.canvas.nodes,
                  i = this.nodesOnScreen,
                  s = 0,
                  r = i.length;
                s < r;
                s++
              )
                i[s].hidden ||
                  (
                    c[i[s].type || this.settings(t, "defaultNodeType")] || c.def
                  )(i[s], this.contexts.nodes, E);
            if (b)
              for (
                c = sigma.canvas.labels,
                  i = this.nodesOnScreen,
                  s = 0,
                  r = i.length;
                s < r;
                s++
              )
                i[s].hidden ||
                  (
                    c[i[s].type || this.settings(t, "defaultNodeType")] || c.def
                  )(i[s], this.contexts.labels, E);
            return this.dispatchEvent("render"), this;
          }),
          (sigma.renderers.canvas.prototype.initDOM = function (e, t) {
            var i = document.createElement(e);
            (i.style.position = "absolute"),
              i.setAttribute("class", "sigma-" + t),
              (this.domElements[t] = i),
              this.container.appendChild(i),
              "canvas" === e.toLowerCase() &&
                (this.contexts[t] = i.getContext("2d"));
          }),
          (sigma.renderers.canvas.prototype.resize = function (t, i) {
            var s,
              n = this.width,
              r = this.height,
              a = sigma.utils.getPixelRatio();
            if (
              (t !== e && i !== e
                ? ((this.width = t), (this.height = i))
                : ((this.width = this.container.offsetWidth),
                  (this.height = this.container.offsetHeight),
                  (t = this.width),
                  (i = this.height)),
              n !== this.width || r !== this.height)
            )
              for (s in this.domElements)
                (this.domElements[s].style.width = t + "px"),
                  (this.domElements[s].style.height = i + "px"),
                  "canvas" === this.domElements[s].tagName.toLowerCase() &&
                    (this.domElements[s].setAttribute("width", t * a + "px"),
                    this.domElements[s].setAttribute("height", i * a + "px"),
                    1 !== a && this.contexts[s].scale(a, a));
            return this;
          }),
          (sigma.renderers.canvas.prototype.clear = function () {
            for (var e in this.contexts)
              this.contexts[e].clearRect(0, 0, this.width, this.height);
            return this;
          }),
          (sigma.renderers.canvas.prototype.kill = function () {
            for (var e, t; (t = this.captors.pop()); ) t.kill();
            for (e in (delete this.captors, this.domElements))
              this.domElements[e].parentNode.removeChild(this.domElements[e]),
                delete this.domElements[e],
                delete this.contexts[e];
            delete this.domElements, delete this.contexts;
          }),
          sigma.utils.pkg("sigma.canvas.nodes"),
          sigma.utils.pkg("sigma.canvas.edges"),
          sigma.utils.pkg("sigma.canvas.labels");
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.captors"),
          (sigma.captors.mouse = function (e, t, i) {
            var s,
              n,
              r,
              a,
              o,
              d,
              h,
              l,
              g,
              c,
              u,
              m = this,
              f = e,
              p = t,
              y = i;
            function x(e) {
              var t, i, c;
              if (
                y("mouseEnabled") &&
                (m.dispatchEvent("mousemove", sigma.utils.mouseCoords(e)), h)
              )
                return (
                  (l = !0),
                  (g = !0),
                  u && clearTimeout(u),
                  (u = setTimeout(function () {
                    l = !1;
                  }, y("dragTimeout"))),
                  sigma.misc.animation.killAll(p),
                  (p.isMoving = !0),
                  (c = p.cameraPosition(
                    sigma.utils.getX(e) - o,
                    sigma.utils.getY(e) - d,
                    !0
                  )),
                  (t = s - c.x),
                  (i = n - c.y),
                  (t === p.x && i === p.y) ||
                    ((r = p.x), (a = p.y), p.goTo({ x: t, y: i })),
                  e.preventDefault ? e.preventDefault() : (e.returnValue = !1),
                  e.stopPropagation(),
                  !1
                );
            }
            function v(e) {
              if (y("mouseEnabled") && h) {
                (h = !1), u && clearTimeout(u), (p.isMoving = !1);
                var t = sigma.utils.getX(e),
                  i = sigma.utils.getY(e);
                l
                  ? (sigma.misc.animation.killAll(p),
                    sigma.misc.animation.camera(
                      p,
                      {
                        x: p.x + y("mouseInertiaRatio") * (p.x - r),
                        y: p.y + y("mouseInertiaRatio") * (p.y - a),
                      },
                      {
                        easing: "quadraticOut",
                        duration: y("mouseInertiaDuration"),
                      }
                    ))
                  : (o === t && d === i) || p.goTo({ x: p.x, y: p.y }),
                  m.dispatchEvent("mouseup", sigma.utils.mouseCoords(e)),
                  (l = !1);
              }
            }
            function b(e) {
              if (y("mouseEnabled"))
                switch (
                  ((s = p.x),
                  (n = p.y),
                  (r = p.x),
                  (a = p.y),
                  (o = sigma.utils.getX(e)),
                  (d = sigma.utils.getY(e)),
                  (g = !1),
                  (c = new Date().getTime()),
                  e.which)
                ) {
                  case 2:
                    break;
                  case 3:
                    m.dispatchEvent(
                      "rightclick",
                      sigma.utils.mouseCoords(e, o, d)
                    );
                    break;
                  default:
                    (h = !0),
                      m.dispatchEvent(
                        "mousedown",
                        sigma.utils.mouseCoords(e, o, d)
                      );
                }
            }
            function w(e) {
              y("mouseEnabled") && m.dispatchEvent("mouseout");
            }
            function E(e) {
              if (y("mouseEnabled")) {
                var t = sigma.utils.mouseCoords(e);
                (t.isDragging = new Date().getTime() - c > 100 && g),
                  m.dispatchEvent("click", t);
              }
              return (
                e.preventDefault ? e.preventDefault() : (e.returnValue = !1),
                e.stopPropagation(),
                !1
              );
            }
            function C(e) {
              var t,
                i,
                s,
                n = sigma.utils.getDelta(e);
              if (y("mouseEnabled") && y("mouseWheelEnabled") && 0 !== n)
                return (
                  (i = n > 0 ? 1 / y("zoomingRatio") : y("zoomingRatio")),
                  (t = p.cameraPosition(
                    sigma.utils.getX(e) - sigma.utils.getCenter(e).x,
                    sigma.utils.getY(e) - sigma.utils.getCenter(e).y,
                    !0
                  )),
                  (s = { duration: y("mouseZoomDuration") }),
                  sigma.utils.zoomTo(p, t.x, t.y, i, s),
                  e.preventDefault ? e.preventDefault() : (e.returnValue = !1),
                  e.stopPropagation(),
                  !1
                );
            }
            sigma.classes.dispatcher.extend(this),
              sigma.utils.doubleClick(f, "click", function (e) {
                var t, i, s;
                if (y("mouseEnabled"))
                  return (
                    (i = 1 / y("doubleClickZoomingRatio")),
                    m.dispatchEvent(
                      "doubleclick",
                      sigma.utils.mouseCoords(e, o, d)
                    ),
                    y("doubleClickEnabled") &&
                      ((t = p.cameraPosition(
                        sigma.utils.getX(e) - sigma.utils.getCenter(e).x,
                        sigma.utils.getY(e) - sigma.utils.getCenter(e).y,
                        !0
                      )),
                      (s = { duration: y("doubleClickZoomDuration") }),
                      sigma.utils.zoomTo(p, t.x, t.y, i, s)),
                    e.preventDefault
                      ? e.preventDefault()
                      : (e.returnValue = !1),
                    e.stopPropagation(),
                    !1
                  );
              }),
              f.addEventListener("DOMMouseScroll", C, !1),
              f.addEventListener("mousewheel", C, !1),
              f.addEventListener("mousemove", x, !1),
              f.addEventListener("mousedown", b, !1),
              f.addEventListener("click", E, !1),
              f.addEventListener("mouseout", w, !1),
              document.addEventListener("mouseup", v, !1),
              (this.kill = function () {
                sigma.utils.unbindDoubleClick(f, "click"),
                  f.removeEventListener("DOMMouseScroll", C),
                  f.removeEventListener("mousewheel", C),
                  f.removeEventListener("mousemove", x),
                  f.removeEventListener("mousedown", b),
                  f.removeEventListener("click", E),
                  f.removeEventListener("mouseout", w),
                  document.removeEventListener("mouseup", v);
              });
          });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.captors"),
          (sigma.captors.touch = function (e, t, i) {
            var s,
              n,
              r,
              a,
              o,
              d,
              h,
              l,
              g,
              c,
              u,
              m,
              f,
              p,
              y,
              x,
              v = this,
              b = e,
              w = t,
              E = i,
              C = [];
            function k(e) {
              var t = sigma.utils.getOffset(b);
              return { x: e.pageX - t.left, y: e.pageY - t.top };
            }
            function A(e) {
              var t, i, p, y, x, v;
              if (E("touchEnabled"))
                switch ((C = e.touches).length) {
                  case 1:
                    (w.isMoving = !0),
                      (f = 1),
                      (s = w.x),
                      (n = w.y),
                      (o = w.x),
                      (d = w.y),
                      (x = k(C[0])),
                      (h = x.x),
                      (l = x.y);
                    break;
                  case 2:
                    return (
                      (w.isMoving = !0),
                      (f = 2),
                      (x = k(C[0])),
                      (v = k(C[1])),
                      (t = x.x),
                      (p = x.y),
                      (i = v.x),
                      (y = v.y),
                      (o = w.x),
                      (d = w.y),
                      (r = w.angle),
                      (a = w.ratio),
                      (s = w.x),
                      (n = w.y),
                      (h = t),
                      (l = p),
                      (g = i),
                      (c = y),
                      (u = Math.atan2(c - l, g - h)),
                      (m = Math.sqrt((c - l) * (c - l) + (g - h) * (g - h))),
                      e.preventDefault(),
                      !1
                    );
                }
            }
            function M(e) {
              if (E("touchEnabled")) {
                C = e.touches;
                var t = E("touchInertiaRatio");
                switch ((x && ((p = !1), clearTimeout(x)), f)) {
                  case 2:
                    if (1 === e.touches.length) {
                      A(e), e.preventDefault();
                      break;
                    }
                  case 1:
                    (w.isMoving = !1),
                      v.dispatchEvent("stopDrag"),
                      p &&
                        ((y = !1),
                        sigma.misc.animation.camera(
                          w,
                          { x: w.x + t * (w.x - o), y: w.y + t * (w.y - d) },
                          {
                            easing: "quadraticOut",
                            duration: E("touchInertiaDuration"),
                          }
                        )),
                      (p = !1),
                      (f = 0);
                }
              }
            }
            function S(e) {
              if (!y && E("touchEnabled")) {
                var t, i, b, A, M, S, O, N, z, T, P, I, j, _, L, F, D;
                switch (
                  ((C = e.touches),
                  (p = !0),
                  x && clearTimeout(x),
                  (x = setTimeout(function () {
                    p = !1;
                  }, E("dragTimeout"))),
                  f)
                ) {
                  case 1:
                    (t = (N = k(C[0])).x),
                      (b = N.y),
                      (T = w.cameraPosition(t - h, b - l, !0)),
                      (_ = s - T.x),
                      (L = n - T.y),
                      (_ === w.x && L === w.y) ||
                        ((o = w.x),
                        (d = w.y),
                        w.goTo({ x: _, y: L }),
                        v.dispatchEvent(
                          "mousemove",
                          sigma.utils.mouseCoords(e, N.x, N.y)
                        ),
                        v.dispatchEvent("drag"));
                    break;
                  case 2:
                    (N = k(C[0])),
                      (z = k(C[1])),
                      (t = N.x),
                      (b = N.y),
                      (i = z.x),
                      (A = z.y),
                      (P = w.cameraPosition(
                        (h + g) / 2 - sigma.utils.getCenter(e).x,
                        (l + c) / 2 - sigma.utils.getCenter(e).y,
                        !0
                      )),
                      (O = w.cameraPosition(
                        (t + i) / 2 - sigma.utils.getCenter(e).x,
                        (b + A) / 2 - sigma.utils.getCenter(e).y,
                        !0
                      )),
                      (I = Math.atan2(A - b, i - t) - u),
                      (j =
                        Math.sqrt((A - b) * (A - b) + (i - t) * (i - t)) / m),
                      (t = P.x),
                      (b = P.y),
                      (F = a / j),
                      (b *= j),
                      (D = r - I),
                      (i =
                        (t *= j) * (M = Math.cos(-I)) + b * (S = Math.sin(-I))),
                      (b = A = b * M - t * S),
                      (_ = (t = i) - O.x + s),
                      (L = b - O.y + n),
                      (F === w.ratio &&
                        D === w.angle &&
                        _ === w.x &&
                        L === w.y) ||
                        ((o = w.x),
                        (d = w.y),
                        w.angle,
                        w.ratio,
                        w.goTo({ x: _, y: L, angle: D, ratio: F }),
                        v.dispatchEvent("drag"));
                }
                return e.preventDefault(), !1;
              }
            }
            sigma.classes.dispatcher.extend(this),
              sigma.utils.doubleClick(b, "touchstart", function (e) {
                var t, i, s;
                if (e.touches && 1 === e.touches.length && E("touchEnabled"))
                  return (
                    (y = !0),
                    (i = 1 / E("doubleClickZoomingRatio")),
                    (t = k(e.touches[0])),
                    v.dispatchEvent(
                      "doubleclick",
                      sigma.utils.mouseCoords(e, t.x, t.y)
                    ),
                    E("doubleClickEnabled") &&
                      ((t = w.cameraPosition(
                        t.x - sigma.utils.getCenter(e).x,
                        t.y - sigma.utils.getCenter(e).y,
                        !0
                      )),
                      (s = {
                        duration: E("doubleClickZoomDuration"),
                        onComplete: function () {
                          y = !1;
                        },
                      }),
                      sigma.utils.zoomTo(w, t.x, t.y, i, s)),
                    e.preventDefault
                      ? e.preventDefault()
                      : (e.returnValue = !1),
                    e.stopPropagation(),
                    !1
                  );
              }),
              b.addEventListener("touchstart", A, !1),
              b.addEventListener("touchend", M, !1),
              b.addEventListener("touchcancel", M, !1),
              b.addEventListener("touchleave", M, !1),
              b.addEventListener("touchmove", S, !1),
              (this.kill = function () {
                sigma.utils.unbindDoubleClick(b, "touchstart"),
                  b.addEventListener("touchstart", A),
                  b.addEventListener("touchend", M),
                  b.addEventListener("touchcancel", M),
                  b.addEventListener("touchleave", M),
                  b.addEventListener("touchmove", S);
              });
          });
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    (function () {
      (function (i) {
        "use strict";
        var s = {
          pointToSquare: function (e) {
            return {
              x1: e.x - e.size,
              y1: e.y - e.size,
              x2: e.x + e.size,
              y2: e.y - e.size,
              height: 2 * e.size,
            };
          },
          lineToSquare: function (e) {
            return e.y1 < e.y2
              ? e.x1 < e.x2
                ? {
                    x1: e.x1 - e.size,
                    y1: e.y1 - e.size,
                    x2: e.x2 + e.size,
                    y2: e.y1 - e.size,
                    height: e.y2 - e.y1 + 2 * e.size,
                  }
                : {
                    x1: e.x2 - e.size,
                    y1: e.y1 - e.size,
                    x2: e.x1 + e.size,
                    y2: e.y1 - e.size,
                    height: e.y2 - e.y1 + 2 * e.size,
                  }
              : e.x1 < e.x2
              ? {
                  x1: e.x1 - e.size,
                  y1: e.y2 - e.size,
                  x2: e.x2 + e.size,
                  y2: e.y2 - e.size,
                  height: e.y1 - e.y2 + 2 * e.size,
                }
              : {
                  x1: e.x2 - e.size,
                  y1: e.y2 - e.size,
                  x2: e.x1 + e.size,
                  y2: e.y2 - e.size,
                  height: e.y1 - e.y2 + 2 * e.size,
                };
          },
          quadraticCurveToSquare: function (e, t) {
            var i = sigma.utils.getPointOnQuadraticCurve(
                0.5,
                e.x1,
                e.y1,
                e.x2,
                e.y2,
                t.x,
                t.y
              ),
              s = Math.min(e.x1, e.x2, i.x),
              n = Math.max(e.x1, e.x2, i.x),
              r = Math.min(e.y1, e.y2, i.y),
              a = Math.max(e.y1, e.y2, i.y);
            return {
              x1: s - e.size,
              y1: r - e.size,
              x2: n + e.size,
              y2: r - e.size,
              height: a - r + 2 * e.size,
            };
          },
          selfLoopToSquare: function (e) {
            var t = sigma.utils.getSelfLoopControlPoints(e.x, e.y, e.size),
              i = Math.min(e.x, t.x1, t.x2),
              s = Math.max(e.x, t.x1, t.x2),
              n = Math.min(e.y, t.y1, t.y2),
              r = Math.max(e.y, t.y1, t.y2);
            return {
              x1: i - e.size,
              y1: n - e.size,
              x2: s + e.size,
              y2: n - e.size,
              height: r - n + 2 * e.size,
            };
          },
          isAxisAligned: function (e) {
            return e.x1 === e.x2 || e.y1 === e.y2;
          },
          axisAlignedTopPoints: function (e) {
            return e.y1 === e.y2 && e.x1 < e.x2
              ? e
              : e.x1 === e.x2 && e.y2 > e.y1
              ? {
                  x1: e.x1 - e.height,
                  y1: e.y1,
                  x2: e.x1,
                  y2: e.y1,
                  height: e.height,
                }
              : e.x1 === e.x2 && e.y2 < e.y1
              ? {
                  x1: e.x1,
                  y1: e.y2,
                  x2: e.x2 + e.height,
                  y2: e.y2,
                  height: e.height,
                }
              : {
                  x1: e.x2,
                  y1: e.y1 - e.height,
                  x2: e.x1,
                  y2: e.y1 - e.height,
                  height: e.height,
                };
          },
          lowerLeftCoor: function (e) {
            var t = Math.sqrt(
              Math.pow(e.x2 - e.x1, 2) + Math.pow(e.y2 - e.y1, 2)
            );
            return {
              x: e.x1 - ((e.y2 - e.y1) * e.height) / t,
              y: e.y1 + ((e.x2 - e.x1) * e.height) / t,
            };
          },
          lowerRightCoor: function (e, t) {
            return { x: t.x - e.x1 + e.x2, y: t.y - e.y1 + e.y2 };
          },
          rectangleCorners: function (e) {
            var t = this.lowerLeftCoor(e),
              i = this.lowerRightCoor(e, t);
            return [
              { x: e.x1, y: e.y1 },
              { x: e.x2, y: e.y2 },
              { x: t.x, y: t.y },
              { x: i.x, y: i.y },
            ];
          },
          splitSquare: function (e) {
            return [
              [
                { x: e.x, y: e.y },
                { x: e.x + e.width / 2, y: e.y },
                { x: e.x, y: e.y + e.height / 2 },
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
              ],
              [
                { x: e.x + e.width / 2, y: e.y },
                { x: e.x + e.width, y: e.y },
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
                { x: e.x + e.width, y: e.y + e.height / 2 },
              ],
              [
                { x: e.x, y: e.y + e.height / 2 },
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
                { x: e.x, y: e.y + e.height },
                { x: e.x + e.width / 2, y: e.y + e.height },
              ],
              [
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
                { x: e.x + e.width, y: e.y + e.height / 2 },
                { x: e.x + e.width / 2, y: e.y + e.height },
                { x: e.x + e.width, y: e.y + e.height },
              ],
            ];
          },
          axis: function (e, t) {
            return [
              { x: e[1].x - e[0].x, y: e[1].y - e[0].y },
              { x: e[1].x - e[3].x, y: e[1].y - e[3].y },
              { x: t[0].x - t[2].x, y: t[0].y - t[2].y },
              { x: t[0].x - t[1].x, y: t[0].y - t[1].y },
            ];
          },
          projection: function (e, t) {
            var i =
              (e.x * t.x + e.y * t.y) / (Math.pow(t.x, 2) + Math.pow(t.y, 2));
            return { x: i * t.x, y: i * t.y };
          },
          axisCollision: function (e, t, i) {
            for (var s = [], n = [], r = 0; r < 4; r++) {
              var a = this.projection(t[r], e),
                o = this.projection(i[r], e);
              s.push(a.x * e.x + a.y * e.y), n.push(o.x * e.x + o.y * e.y);
            }
            var d = Math.max.apply(Math, s),
              h = Math.max.apply(Math, n),
              l = Math.min.apply(Math, s);
            return Math.min.apply(Math, n) <= d && h >= l;
          },
          collision: function (e, t) {
            for (var i = this.axis(e, t), s = !0, n = 0; n < 4; n++)
              s = s && this.axisCollision(i[n], e, t);
            return s;
          },
        };
        function n(e, t) {
          for (var i = [], s = 0; s < 4; s++)
            e.x2 >= t[s][0].x &&
              e.x1 <= t[s][1].x &&
              e.y1 + e.height >= t[s][0].y &&
              e.y1 <= t[s][2].y &&
              i.push(s);
          return i;
        }
        function r(e, t) {
          for (var i = [], n = 0; n < 4; n++) s.collision(e, t[n]) && i.push(n);
          return i;
        }
        function a(e, t) {
          var i,
            s,
            n = t.level + 1,
            r = Math.round(t.bounds.width / 2),
            a = Math.round(t.bounds.height / 2),
            o = Math.round(t.bounds.x),
            h = Math.round(t.bounds.y);
          switch (e) {
            case 0:
              (i = o), (s = h);
              break;
            case 1:
              (i = o + r), (s = h);
              break;
            case 2:
              (i = o), (s = h + a);
              break;
            case 3:
              (i = o + r), (s = h + a);
          }
          return d(
            { x: i, y: s, width: r, height: a },
            n,
            t.maxElements,
            t.maxLevel
          );
        }
        function o(e, t, s) {
          if (s.level < s.maxLevel)
            for (var r = n(t, s.corners), d = 0, h = r.length; d < h; d++)
              s.nodes[r[d]] === i && (s.nodes[r[d]] = a(r[d], s)),
                o(e, t, s.nodes[r[d]]);
          else s.elements.push(e);
        }
        function d(e, t, i, n) {
          return {
            level: t || 0,
            bounds: e,
            corners: s.splitSquare(e),
            maxElements: i || 40,
            maxLevel: n || 8,
            elements: [],
            nodes: [],
          };
        }
        var h = function () {
          (this._geom = s),
            (this._tree = null),
            (this._cache = { query: !1, result: !1 }),
            (this._enabled = !0);
        };
        (h.prototype.index = function (e, t) {
          if (!this._enabled) return this._tree;
          if (!t.bounds)
            throw "sigma.classes.edgequad.index: bounds information not given.";
          var i,
            n,
            r,
            a,
            h,
            l = t.prefix || "";
          this._tree = d(t.bounds, 0, t.maxElements, t.maxLevel);
          for (var g = e.edges(), c = 0, u = g.length; c < u; c++)
            (n = e.nodes(g[c].source)),
              (r = e.nodes(g[c].target)),
              (h = {
                x1: n[l + "x"],
                y1: n[l + "y"],
                x2: r[l + "x"],
                y2: r[l + "y"],
                size: g[c][l + "size"] || 0,
              }),
              "curve" === g[c].type || "curvedArrow" === g[c].type
                ? n.id === r.id
                  ? ((a = {
                      x: n[l + "x"],
                      y: n[l + "y"],
                      size: n[l + "size"] || 0,
                    }),
                    o(g[c], s.selfLoopToSquare(a), this._tree))
                  : ((i = sigma.utils.getQuadraticControlPoint(
                      h.x1,
                      h.y1,
                      h.x2,
                      h.y2
                    )),
                    o(g[c], s.quadraticCurveToSquare(h, i), this._tree))
                : o(g[c], s.lineToSquare(h), this._tree);
          return (this._cache = { query: !1, result: !1 }), this._tree;
        }),
          (h.prototype.point = function (e, t) {
            return (
              (this._enabled &&
                this._tree &&
                (function e(t, s) {
                  if (s.level < s.maxLevel) {
                    var n = (function (e, t) {
                      var i = t.x + t.width / 2,
                        s = t.y + t.height / 2,
                        n = e.y < s,
                        r = e.x < i;
                      return n ? (r ? 0 : 1) : r ? 2 : 3;
                    })(t, s.bounds);
                    return s.nodes[n] !== i ? e(t, s.nodes[n]) : [];
                  }
                  return s.elements;
                })({ x: e, y: t }, this._tree)) ||
              []
            );
          }),
          (h.prototype.area = function (e) {
            if (!this._enabled) return [];
            var t,
              a,
              o = JSON.stringify(e);
            if (this._cache.query === o) return this._cache.result;
            s.isAxisAligned(e)
              ? ((t = n), (a = s.axisAlignedTopPoints(e)))
              : ((t = r), (a = s.rectangleCorners(e)));
            var d = this._tree
                ? (function e(t, s, n, r) {
                    if (((r = r || {}), s.level < s.maxLevel))
                      for (
                        var a = n(t, s.corners), o = 0, d = a.length;
                        o < d;
                        o++
                      )
                        s.nodes[a[o]] !== i && e(t, s.nodes[a[o]], n, r);
                    else
                      for (var h = 0, l = s.elements.length; h < l; h++)
                        r[s.elements[h].id] === i &&
                          (r[s.elements[h].id] = s.elements[h]);
                    return r;
                  })(a, this._tree, t)
                : [],
              h = [];
            for (var l in d) h.push(d[l]);
            return (this._cache.query = o), (this._cache.result = h), h;
          }),
          void 0 !== this.sigma
            ? ((this.sigma.classes = this.sigma.classes || {}),
              (this.sigma.classes.edgequad = h))
            : (void 0 !== e && e.exports && (t = e.exports = h),
              (t.edgequad = h));
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    (function () {
      (function (i) {
        "use strict";
        var s = {
          pointToSquare: function (e) {
            return {
              x1: e.x - e.size,
              y1: e.y - e.size,
              x2: e.x + e.size,
              y2: e.y - e.size,
              height: 2 * e.size,
            };
          },
          isAxisAligned: function (e) {
            return e.x1 === e.x2 || e.y1 === e.y2;
          },
          axisAlignedTopPoints: function (e) {
            return e.y1 === e.y2 && e.x1 < e.x2
              ? e
              : e.x1 === e.x2 && e.y2 > e.y1
              ? {
                  x1: e.x1 - e.height,
                  y1: e.y1,
                  x2: e.x1,
                  y2: e.y1,
                  height: e.height,
                }
              : e.x1 === e.x2 && e.y2 < e.y1
              ? {
                  x1: e.x1,
                  y1: e.y2,
                  x2: e.x2 + e.height,
                  y2: e.y2,
                  height: e.height,
                }
              : {
                  x1: e.x2,
                  y1: e.y1 - e.height,
                  x2: e.x1,
                  y2: e.y1 - e.height,
                  height: e.height,
                };
          },
          lowerLeftCoor: function (e) {
            var t = Math.sqrt(
              Math.pow(e.x2 - e.x1, 2) + Math.pow(e.y2 - e.y1, 2)
            );
            return {
              x: e.x1 - ((e.y2 - e.y1) * e.height) / t,
              y: e.y1 + ((e.x2 - e.x1) * e.height) / t,
            };
          },
          lowerRightCoor: function (e, t) {
            return { x: t.x - e.x1 + e.x2, y: t.y - e.y1 + e.y2 };
          },
          rectangleCorners: function (e) {
            var t = this.lowerLeftCoor(e),
              i = this.lowerRightCoor(e, t);
            return [
              { x: e.x1, y: e.y1 },
              { x: e.x2, y: e.y2 },
              { x: t.x, y: t.y },
              { x: i.x, y: i.y },
            ];
          },
          splitSquare: function (e) {
            return [
              [
                { x: e.x, y: e.y },
                { x: e.x + e.width / 2, y: e.y },
                { x: e.x, y: e.y + e.height / 2 },
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
              ],
              [
                { x: e.x + e.width / 2, y: e.y },
                { x: e.x + e.width, y: e.y },
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
                { x: e.x + e.width, y: e.y + e.height / 2 },
              ],
              [
                { x: e.x, y: e.y + e.height / 2 },
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
                { x: e.x, y: e.y + e.height },
                { x: e.x + e.width / 2, y: e.y + e.height },
              ],
              [
                { x: e.x + e.width / 2, y: e.y + e.height / 2 },
                { x: e.x + e.width, y: e.y + e.height / 2 },
                { x: e.x + e.width / 2, y: e.y + e.height },
                { x: e.x + e.width, y: e.y + e.height },
              ],
            ];
          },
          axis: function (e, t) {
            return [
              { x: e[1].x - e[0].x, y: e[1].y - e[0].y },
              { x: e[1].x - e[3].x, y: e[1].y - e[3].y },
              { x: t[0].x - t[2].x, y: t[0].y - t[2].y },
              { x: t[0].x - t[1].x, y: t[0].y - t[1].y },
            ];
          },
          projection: function (e, t) {
            var i =
              (e.x * t.x + e.y * t.y) / (Math.pow(t.x, 2) + Math.pow(t.y, 2));
            return { x: i * t.x, y: i * t.y };
          },
          axisCollision: function (e, t, i) {
            for (var s = [], n = [], r = 0; r < 4; r++) {
              var a = this.projection(t[r], e),
                o = this.projection(i[r], e);
              s.push(a.x * e.x + a.y * e.y), n.push(o.x * e.x + o.y * e.y);
            }
            var d = Math.max.apply(Math, s),
              h = Math.max.apply(Math, n),
              l = Math.min.apply(Math, s);
            return Math.min.apply(Math, n) <= d && h >= l;
          },
          collision: function (e, t) {
            for (var i = this.axis(e, t), s = !0, n = 0; n < 4; n++)
              s = s && this.axisCollision(i[n], e, t);
            return s;
          },
        };
        function n(e, t) {
          for (var i = [], s = 0; s < 4; s++)
            e.x2 >= t[s][0].x &&
              e.x1 <= t[s][1].x &&
              e.y1 + e.height >= t[s][0].y &&
              e.y1 <= t[s][2].y &&
              i.push(s);
          return i;
        }
        function r(e, t) {
          for (var i = [], n = 0; n < 4; n++) s.collision(e, t[n]) && i.push(n);
          return i;
        }
        function a(e, t) {
          var i,
            s,
            n = t.level + 1,
            r = Math.round(t.bounds.width / 2),
            a = Math.round(t.bounds.height / 2),
            o = Math.round(t.bounds.x),
            h = Math.round(t.bounds.y);
          switch (e) {
            case 0:
              (i = o), (s = h);
              break;
            case 1:
              (i = o + r), (s = h);
              break;
            case 2:
              (i = o), (s = h + a);
              break;
            case 3:
              (i = o + r), (s = h + a);
          }
          return d(
            { x: i, y: s, width: r, height: a },
            n,
            t.maxElements,
            t.maxLevel
          );
        }
        function o(e, t, s) {
          if (s.level < s.maxLevel)
            for (var r = n(t, s.corners), d = 0, h = r.length; d < h; d++)
              s.nodes[r[d]] === i && (s.nodes[r[d]] = a(r[d], s)),
                o(e, t, s.nodes[r[d]]);
          else s.elements.push(e);
        }
        function d(e, t, i, n) {
          return {
            level: t || 0,
            bounds: e,
            corners: s.splitSquare(e),
            maxElements: i || 20,
            maxLevel: n || 4,
            elements: [],
            nodes: [],
          };
        }
        var h = function () {
          (this._geom = s),
            (this._tree = null),
            (this._cache = { query: !1, result: !1 });
        };
        (h.prototype.index = function (e, t) {
          if (!t.bounds)
            throw "sigma.classes.quad.index: bounds information not given.";
          var i = t.prefix || "";
          this._tree = d(t.bounds, 0, t.maxElements, t.maxLevel);
          for (var n = 0, r = e.length; n < r; n++)
            o(
              e[n],
              s.pointToSquare({
                x: e[n][i + "x"],
                y: e[n][i + "y"],
                size: e[n][i + "size"],
              }),
              this._tree
            );
          return (this._cache = { query: !1, result: !1 }), this._tree;
        }),
          (h.prototype.point = function (e, t) {
            return (
              (this._tree &&
                (function e(t, s) {
                  if (s.level < s.maxLevel) {
                    var n = (function (e, t) {
                      var i = t.x + t.width / 2,
                        s = t.y + t.height / 2,
                        n = e.y < s,
                        r = e.x < i;
                      return n ? (r ? 0 : 1) : r ? 2 : 3;
                    })(t, s.bounds);
                    return s.nodes[n] !== i ? e(t, s.nodes[n]) : [];
                  }
                  return s.elements;
                })({ x: e, y: t }, this._tree)) ||
              []
            );
          }),
          (h.prototype.area = function (e) {
            var t,
              a,
              o = JSON.stringify(e);
            if (this._cache.query === o) return this._cache.result;
            s.isAxisAligned(e)
              ? ((t = n), (a = s.axisAlignedTopPoints(e)))
              : ((t = r), (a = s.rectangleCorners(e)));
            var d = this._tree
                ? (function e(t, s, n, r) {
                    if (((r = r || {}), s.level < s.maxLevel))
                      for (
                        var a = n(t, s.corners), o = 0, d = a.length;
                        o < d;
                        o++
                      )
                        s.nodes[a[o]] !== i && e(t, s.nodes[a[o]], n, r);
                    else
                      for (var h = 0, l = s.elements.length; h < l; h++)
                        r[s.elements[h].id] === i &&
                          (r[s.elements[h].id] = s.elements[h]);
                    return r;
                  })(a, this._tree, t)
                : [],
              h = [];
            for (var l in d) h.push(d[l]);
            return (this._cache.query = o), (this._cache.result = h), h;
          }),
          void 0 !== this.sigma
            ? ((this.sigma.classes = this.sigma.classes || {}),
              (this.sigma.classes.quad = h))
            : (void 0 !== e && e.exports && (t = e.exports = h), (t.quad = h));
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.classes"),
          (sigma.classes.camera = function (e, t, i, s) {
            sigma.classes.dispatcher.extend(this),
              Object.defineProperty(this, "graph", { value: t }),
              Object.defineProperty(this, "id", { value: e }),
              Object.defineProperty(this, "readPrefix", {
                value: "read_cam" + e + ":",
              }),
              Object.defineProperty(this, "prefix", { value: "cam" + e + ":" }),
              (this.x = 0),
              (this.y = 0),
              (this.ratio = 1),
              (this.angle = 0),
              (this.isAnimated = !1),
              (this.settings =
                "object" == typeof s && s ? i.embedObject(s) : i);
          }),
          (sigma.classes.camera.prototype.goTo = function (t) {
            if (!this.settings("enableCamera")) return this;
            var i,
              s,
              n = t || {},
              r = ["x", "y", "ratio", "angle"];
            for (i = 0, s = r.length; i < s; i++)
              if (n[r[i]] !== e) {
                if ("number" != typeof n[r[i]] || isNaN(n[r[i]]))
                  throw 'Value for "' + r[i] + '" is not a number.';
                this[r[i]] = n[r[i]];
              }
            return this.dispatchEvent("coordinatesUpdated"), this;
          }),
          (sigma.classes.camera.prototype.applyView = function (t, i, s) {
            (s = s || {}),
              (i = i !== e ? i : this.prefix),
              (t = t !== e ? t : this.readPrefix);
            var n,
              r,
              a,
              o = s.nodes || this.graph.nodes(),
              d = s.edges || this.graph.edges(),
              h = Math.cos(this.angle) / this.ratio,
              l = Math.sin(this.angle) / this.ratio,
              g = Math.pow(this.ratio, this.settings("nodesPowRatio")),
              c = Math.pow(this.ratio, this.settings("edgesPowRatio")),
              u = (s.width || 0) / 2 - this.x * h - this.y * l,
              m = (s.height || 0) / 2 - this.y * h + this.x * l;
            for (n = 0, r = o.length; n < r; n++)
              ((a = o[n])[i + "x"] =
                (a[t + "x"] || 0) * h + (a[t + "y"] || 0) * l + u),
                (a[i + "y"] =
                  (a[t + "y"] || 0) * h - (a[t + "x"] || 0) * l + m),
                (a[i + "size"] = (a[t + "size"] || 0) / g);
            for (n = 0, r = d.length; n < r; n++)
              d[n][i + "size"] = (d[n][t + "size"] || 0) / c;
            return this;
          }),
          (sigma.classes.camera.prototype.graphPosition = function (e, t, i) {
            var s = 0,
              n = 0,
              r = Math.cos(this.angle),
              a = Math.sin(this.angle);
            return (
              i ||
                ((s = -(this.x * r + this.y * a) / this.ratio),
                (n = -(this.y * r - this.x * a) / this.ratio)),
              {
                x: (e * r + t * a) / this.ratio + s,
                y: (t * r - e * a) / this.ratio + n,
              }
            );
          }),
          (sigma.classes.camera.prototype.cameraPosition = function (e, t, i) {
            var s = 0,
              n = 0,
              r = Math.cos(this.angle),
              a = Math.sin(this.angle);
            return (
              i ||
                ((s = -(this.x * r + this.y * a) / this.ratio),
                (n = -(this.y * r - this.x * a) / this.ratio)),
              {
                x: ((e - s) * r - (t - n) * a) * this.ratio,
                y: ((t - n) * r + (e - s) * a) * this.ratio,
              }
            );
          }),
          (sigma.classes.camera.prototype.getMatrix = function () {
            var e = sigma.utils.matrices.scale(1 / this.ratio),
              t = sigma.utils.matrices.rotation(this.angle),
              i = sigma.utils.matrices.translation(-this.x, -this.y);
            return sigma.utils.matrices.multiply(
              i,
              sigma.utils.matrices.multiply(t, e)
            );
          }),
          (sigma.classes.camera.prototype.getRectangle = function (e, t) {
            var i = this.cameraPosition(e, 0, !0),
              s = this.cameraPosition(0, t, !0),
              n = this.cameraPosition(e / 2, t / 2, !0),
              r = this.cameraPosition(e / 4, 0, !0).x,
              a = this.cameraPosition(0, t / 4, !0).y;
            return {
              x1: this.x - n.x - r,
              y1: this.y - n.y - a,
              x2: this.x - n.x + r + i.x,
              y2: this.y - n.y - a + i.y,
              height: Math.sqrt(Math.pow(s.x, 2) + Math.pow(s.y + 2 * a, 2)),
            };
          });
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    (function () {
      (function (i) {
        "use strict";
        var s = Object.create(null),
          n = Object.create(null),
          r = Object.create(null),
          a = Object.create(null),
          o = Object.create(null),
          d = { immutable: !0, clone: !0 },
          h = function (e) {
            return d[e];
          },
          l = function (e) {
            var t, i, n;
            for (t in ((n = {
              settings: e || h,
              nodesArray: [],
              edgesArray: [],
              nodesIndex: Object.create(null),
              edgesIndex: Object.create(null),
              inNeighborsIndex: Object.create(null),
              outNeighborsIndex: Object.create(null),
              allNeighborsIndex: Object.create(null),
              inNeighborsCount: Object.create(null),
              outNeighborsCount: Object.create(null),
              allNeighborsCount: Object.create(null),
            }),
            r))
              r[t].call(n);
            for (t in s) (i = g(t, n, s[t])), (this[t] = i), (n[t] = i);
          };
        function g(e, t, i) {
          return function () {
            var s, n;
            for (s in o[e]) o[e][s].apply(t, arguments);
            for (s in ((n = i.apply(t, arguments)), a[e]))
              a[e][s].apply(t, arguments);
            return n;
          };
        }
        function c(e) {
          var t;
          for (t in e)
            ("hasOwnProperty" in e && !e.hasOwnProperty(t)) || delete e[t];
          return e;
        }
        (l.addMethod = function (e, t) {
          if (
            "string" != typeof e ||
            "function" != typeof t ||
            2 !== arguments.length
          )
            throw "addMethod: Wrong arguments.";
          if (s[e] || l[e]) throw 'The method "' + e + '" already exists.';
          return (
            (s[e] = t),
            (a[e] = Object.create(null)),
            (o[e] = Object.create(null)),
            this
          );
        }),
          (l.hasMethod = function (e) {
            return !(!s[e] && !l[e]);
          }),
          (l.attach = function (e, t, i, s) {
            if (
              "string" != typeof e ||
              "string" != typeof t ||
              "function" != typeof i ||
              arguments.length < 3 ||
              arguments.length > 4
            )
              throw "attach: Wrong arguments.";
            var n;
            if ("constructor" === e) n = r;
            else if (s) {
              if (!o[e]) throw 'The method "' + e + '" does not exist.';
              n = o[e];
            } else {
              if (!a[e]) throw 'The method "' + e + '" does not exist.';
              n = a[e];
            }
            if (n[t])
              throw (
                'A function "' +
                t +
                '" is already attached to the method "' +
                e +
                '".'
              );
            return (n[t] = i), this;
          }),
          (l.attachBefore = function (e, t, i) {
            return this.attach(e, t, i, !0);
          }),
          (l.addIndex = function (e, t) {
            if (
              "string" != typeof e ||
              Object(t) !== t ||
              2 !== arguments.length
            )
              throw "addIndex: Wrong arguments.";
            if (n[e]) throw 'The index "' + e + '" already exists.';
            var i;
            for (i in ((n[e] = t), t)) {
              if ("function" != typeof t[i])
                throw "The bindings must be functions.";
              l.attach(i, e, t[i]);
            }
            return this;
          }),
          l.addMethod("addNode", function (e) {
            if (Object(e) !== e || 1 !== arguments.length)
              throw "addNode: Wrong arguments.";
            if ("string" != typeof e.id && "number" != typeof e.id)
              throw "The node must have a string or number id.";
            if (this.nodesIndex[e.id])
              throw 'The node "' + e.id + '" already exists.';
            var t,
              i = e.id,
              s = Object.create(null);
            if (this.settings("clone"))
              for (t in e) "id" !== t && (s[t] = e[t]);
            else s = e;
            return (
              this.settings("immutable")
                ? Object.defineProperty(s, "id", { value: i, enumerable: !0 })
                : (s.id = i),
              (this.inNeighborsIndex[i] = Object.create(null)),
              (this.outNeighborsIndex[i] = Object.create(null)),
              (this.allNeighborsIndex[i] = Object.create(null)),
              (this.inNeighborsCount[i] = 0),
              (this.outNeighborsCount[i] = 0),
              (this.allNeighborsCount[i] = 0),
              this.nodesArray.push(s),
              (this.nodesIndex[s.id] = s),
              this
            );
          }),
          l.addMethod("addEdge", function (e) {
            if (Object(e) !== e || 1 !== arguments.length)
              throw "addEdge: Wrong arguments.";
            if ("string" != typeof e.id && "number" != typeof e.id)
              throw "The edge must have a string or number id.";
            if (
              ("string" != typeof e.source && "number" != typeof e.source) ||
              !this.nodesIndex[e.source]
            )
              throw "The edge source must have an existing node id.";
            if (
              ("string" != typeof e.target && "number" != typeof e.target) ||
              !this.nodesIndex[e.target]
            )
              throw "The edge target must have an existing node id.";
            if (this.edgesIndex[e.id])
              throw 'The edge "' + e.id + '" already exists.';
            var t,
              i = Object.create(null);
            if (this.settings("clone"))
              for (t in e)
                "id" !== t && "source" !== t && "target" !== t && (i[t] = e[t]);
            else i = e;
            return (
              this.settings("immutable")
                ? (Object.defineProperty(i, "id", {
                    value: e.id,
                    enumerable: !0,
                  }),
                  Object.defineProperty(i, "source", {
                    value: e.source,
                    enumerable: !0,
                  }),
                  Object.defineProperty(i, "target", {
                    value: e.target,
                    enumerable: !0,
                  }))
                : ((i.id = e.id), (i.source = e.source), (i.target = e.target)),
              this.edgesArray.push(i),
              (this.edgesIndex[i.id] = i),
              this.inNeighborsIndex[i.target][i.source] ||
                (this.inNeighborsIndex[i.target][i.source] =
                  Object.create(null)),
              (this.inNeighborsIndex[i.target][i.source][i.id] = i),
              this.outNeighborsIndex[i.source][i.target] ||
                (this.outNeighborsIndex[i.source][i.target] =
                  Object.create(null)),
              (this.outNeighborsIndex[i.source][i.target][i.id] = i),
              this.allNeighborsIndex[i.source][i.target] ||
                (this.allNeighborsIndex[i.source][i.target] =
                  Object.create(null)),
              (this.allNeighborsIndex[i.source][i.target][i.id] = i),
              i.target !== i.source &&
                (this.allNeighborsIndex[i.target][i.source] ||
                  (this.allNeighborsIndex[i.target][i.source] =
                    Object.create(null)),
                (this.allNeighborsIndex[i.target][i.source][i.id] = i)),
              this.inNeighborsCount[i.target]++,
              this.outNeighborsCount[i.source]++,
              this.allNeighborsCount[i.target]++,
              this.allNeighborsCount[i.source]++,
              this
            );
          }),
          l.addMethod("dropNode", function (e) {
            if (
              ("string" != typeof e && "number" != typeof e) ||
              1 !== arguments.length
            )
              throw "dropNode: Wrong arguments.";
            if (!this.nodesIndex[e])
              throw 'The node "' + e + '" does not exist.';
            var t, i, s;
            for (
              delete this.nodesIndex[e], t = 0, s = this.nodesArray.length;
              t < s;
              t++
            )
              if (this.nodesArray[t].id === e) {
                this.nodesArray.splice(t, 1);
                break;
              }
            for (t = this.edgesArray.length - 1; t >= 0; t--)
              (this.edgesArray[t].source !== e &&
                this.edgesArray[t].target !== e) ||
                this.dropEdge(this.edgesArray[t].id);
            for (i in (delete this.inNeighborsIndex[e],
            delete this.outNeighborsIndex[e],
            delete this.allNeighborsIndex[e],
            delete this.inNeighborsCount[e],
            delete this.outNeighborsCount[e],
            delete this.allNeighborsCount[e],
            this.nodesIndex))
              delete this.inNeighborsIndex[i][e],
                delete this.outNeighborsIndex[i][e],
                delete this.allNeighborsIndex[i][e];
            return this;
          }),
          l.addMethod("dropEdge", function (e) {
            if (
              ("string" != typeof e && "number" != typeof e) ||
              1 !== arguments.length
            )
              throw "dropEdge: Wrong arguments.";
            if (!this.edgesIndex[e])
              throw 'The edge "' + e + '" does not exist.';
            var t, i, s;
            for (
              s = this.edgesIndex[e],
                delete this.edgesIndex[e],
                t = 0,
                i = this.edgesArray.length;
              t < i;
              t++
            )
              if (this.edgesArray[t].id === e) {
                this.edgesArray.splice(t, 1);
                break;
              }
            return (
              delete this.inNeighborsIndex[s.target][s.source][s.id],
              Object.keys(this.inNeighborsIndex[s.target][s.source]).length ||
                delete this.inNeighborsIndex[s.target][s.source],
              delete this.outNeighborsIndex[s.source][s.target][s.id],
              Object.keys(this.outNeighborsIndex[s.source][s.target]).length ||
                delete this.outNeighborsIndex[s.source][s.target],
              delete this.allNeighborsIndex[s.source][s.target][s.id],
              Object.keys(this.allNeighborsIndex[s.source][s.target]).length ||
                delete this.allNeighborsIndex[s.source][s.target],
              s.target !== s.source &&
                (delete this.allNeighborsIndex[s.target][s.source][s.id],
                Object.keys(this.allNeighborsIndex[s.target][s.source])
                  .length || delete this.allNeighborsIndex[s.target][s.source]),
              this.inNeighborsCount[s.target]--,
              this.outNeighborsCount[s.source]--,
              this.allNeighborsCount[s.source]--,
              this.allNeighborsCount[s.target]--,
              this
            );
          }),
          l.addMethod("kill", function () {
            (this.nodesArray.length = 0),
              (this.edgesArray.length = 0),
              delete this.nodesArray,
              delete this.edgesArray,
              delete this.nodesIndex,
              delete this.edgesIndex,
              delete this.inNeighborsIndex,
              delete this.outNeighborsIndex,
              delete this.allNeighborsIndex,
              delete this.inNeighborsCount,
              delete this.outNeighborsCount,
              delete this.allNeighborsCount;
          }),
          l.addMethod("clear", function () {
            return (
              (this.nodesArray.length = 0),
              (this.edgesArray.length = 0),
              c(this.nodesIndex),
              c(this.edgesIndex),
              c(this.nodesIndex),
              c(this.inNeighborsIndex),
              c(this.outNeighborsIndex),
              c(this.allNeighborsIndex),
              c(this.inNeighborsCount),
              c(this.outNeighborsCount),
              c(this.allNeighborsCount),
              this
            );
          }),
          l.addMethod("read", function (e) {
            var t, i, s;
            for (t = 0, s = (i = e.nodes || []).length; t < s; t++)
              this.addNode(i[t]);
            for (t = 0, s = (i = e.edges || []).length; t < s; t++)
              this.addEdge(i[t]);
            return this;
          }),
          l.addMethod("nodes", function (e) {
            if (!arguments.length) return this.nodesArray.slice(0);
            if (
              1 === arguments.length &&
              ("string" == typeof e || "number" == typeof e)
            )
              return this.nodesIndex[e];
            if (
              1 === arguments.length &&
              "[object Array]" === Object.prototype.toString.call(e)
            ) {
              var t,
                i,
                s = [];
              for (t = 0, i = e.length; t < i; t++) {
                if ("string" != typeof e[t] && "number" != typeof e[t])
                  throw "nodes: Wrong arguments.";
                s.push(this.nodesIndex[e[t]]);
              }
              return s;
            }
            throw "nodes: Wrong arguments.";
          }),
          l.addMethod("degree", function (e, t) {
            if (
              ((t =
                { in: this.inNeighborsCount, out: this.outNeighborsCount }[
                  t || ""
                ] || this.allNeighborsCount),
              "string" == typeof e || "number" == typeof e)
            )
              return t[e];
            if ("[object Array]" === Object.prototype.toString.call(e)) {
              var i,
                s,
                n = [];
              for (i = 0, s = e.length; i < s; i++) {
                if ("string" != typeof e[i] && "number" != typeof e[i])
                  throw "degree: Wrong arguments.";
                n.push(t[e[i]]);
              }
              return n;
            }
            throw "degree: Wrong arguments.";
          }),
          l.addMethod("edges", function (e) {
            if (!arguments.length) return this.edgesArray.slice(0);
            if (
              1 === arguments.length &&
              ("string" == typeof e || "number" == typeof e)
            )
              return this.edgesIndex[e];
            if (
              1 === arguments.length &&
              "[object Array]" === Object.prototype.toString.call(e)
            ) {
              var t,
                i,
                s = [];
              for (t = 0, i = e.length; t < i; t++) {
                if ("string" != typeof e[t] && "number" != typeof e[t])
                  throw "edges: Wrong arguments.";
                s.push(this.edgesIndex[e[t]]);
              }
              return s;
            }
            throw "edges: Wrong arguments.";
          }),
          "undefined" != typeof sigma
            ? ((sigma.classes = sigma.classes || Object.create(null)),
              (sigma.classes.graph = l))
            : (void 0 !== e && e.exports && (t = e.exports = l), (t.graph = l));
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    (function () {
      (function () {
        "use strict";
        var i = function () {
          var e,
            t,
            s = {},
            n = Array.prototype.slice.call(arguments, 0),
            r = function (e, t) {
              var i, a, o, d;
              if (1 !== arguments.length || "string" != typeof e) {
                if ("object" == typeof e && "string" == typeof t)
                  return void 0 !== (e || {})[t] ? e[t] : r(t);
                for (
                  i = "object" == typeof e && void 0 === t ? e : {},
                    "string" == typeof e && (i[e] = t),
                    a = 0,
                    o = (d = Object.keys(i)).length;
                  a < o;
                  a++
                )
                  s[d[a]] = i[d[a]];
                return this;
              }
              if (void 0 !== s[e]) return s[e];
              for (a = 0, o = n.length; a < o; a++)
                if (void 0 !== n[a][e]) return n[a][e];
            };
          for (
            r.embedObjects = function () {
              var e = n
                .concat(s)
                .concat(Array.prototype.splice.call(arguments, 0));
              return i.apply({}, e);
            },
              e = 0,
              t = arguments.length;
            e < t;
            e++
          )
            r(arguments[e]);
          return r;
        };
        void 0 !== this.sigma
          ? ((this.sigma.classes = this.sigma.classes || {}),
            (this.sigma.classes.configurable = i))
          : (void 0 !== e && e.exports && (t = e.exports = i),
            (t.configurable = i));
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    (function () {
      (function () {
        "use strict";
        var i = function () {
          Object.defineProperty(this, "_handlers", { value: {} });
        };
        (i.prototype.bind = function (e, t) {
          var i, s, n, r;
          if (1 === arguments.length && "object" == typeof arguments[0])
            for (e in arguments[0]) this.bind(e, arguments[0][e]);
          else {
            if (2 !== arguments.length || "function" != typeof arguments[1])
              throw "bind: Wrong arguments.";
            for (
              i = 0, s = (r = "string" == typeof e ? e.split(" ") : e).length;
              i !== s;
              i += 1
            )
              (n = r[i]) &&
                (this._handlers[n] || (this._handlers[n] = []),
                this._handlers[n].push({ handler: t }));
          }
          return this;
        }),
          (i.prototype.unbind = function (e, t) {
            var i,
              s,
              n,
              r,
              a,
              o,
              d,
              h = "string" == typeof e ? e.split(" ") : e;
            if (!arguments.length) {
              for (a in this._handlers) delete this._handlers[a];
              return this;
            }
            if (t)
              for (i = 0, s = h.length; i !== s; i += 1) {
                if (((d = h[i]), this._handlers[d])) {
                  for (
                    o = [], n = 0, r = this._handlers[d].length;
                    n !== r;
                    n += 1
                  )
                    this._handlers[d][n].handler !== t &&
                      o.push(this._handlers[d][n]);
                  this._handlers[d] = o;
                }
                this._handlers[d] &&
                  0 === this._handlers[d].length &&
                  delete this._handlers[d];
              }
            else
              for (i = 0, s = h.length; i !== s; i += 1)
                delete this._handlers[h[i]];
            return this;
          }),
          (i.prototype.dispatchEvent = function (e, t) {
            var i,
              s,
              n,
              r,
              a,
              o,
              d,
              h = "string" == typeof e ? e.split(" ") : e;
            for (
              t = void 0 === t ? {} : t, i = 0, s = h.length;
              i !== s;
              i += 1
            )
              if (((d = h[i]), this._handlers[d])) {
                for (
                  o = this.getEvent(d, t),
                    a = [],
                    n = 0,
                    r = this._handlers[d].length;
                  n !== r;
                  n += 1
                )
                  this._handlers[d][n].handler(o),
                    this._handlers[d][n].one || a.push(this._handlers[d][n]);
                this._handlers[d] = a;
              }
            return this;
          }),
          (i.prototype.getEvent = function (e, t) {
            return { type: e, data: t || {}, target: this };
          }),
          (i.extend = function (e, t) {
            var s;
            for (s in i.prototype)
              i.prototype.hasOwnProperty(s) && (e[s] = i.prototype[s]);
            i.apply(e, t);
          }),
          void 0 !== this.sigma
            ? ((this.sigma.classes = this.sigma.classes || {}),
              (this.sigma.classes.dispatcher = i))
            : (void 0 !== e && e.exports && (t = e.exports = i),
              (t.dispatcher = i));
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        sigma.utils.pkg("sigma.settings");
        sigma.settings = sigma.utils.extend(sigma.settings || {}, {
          clone: !0,
          immutable: !0,
          verbose: !1,
          classPrefix: "sigma",
          defaultNodeType: "def",
          defaultEdgeType: "def",
          defaultLabelColor: "#000",
          defaultEdgeColor: "#000",
          defaultNodeColor: "#000",
          defaultLabelSize: 14,
          edgeColor: "source",
          minArrowSize: 0,
          font: "arial",
          fontStyle: "",
          labelColor: "default",
          labelSize: "fixed",
          labelSizeRatio: 1,
          labelThreshold: 8,
          webglOversamplingRatio: 2,
          borderSize: 0,
          defaultNodeBorderColor: "#000",
          hoverFont: "",
          singleHover: !0,
          hoverFontStyle: "",
          labelHoverShadow: "default",
          labelHoverShadowColor: "#000",
          nodeHoverColor: "node",
          defaultNodeHoverColor: "#000",
          labelHoverBGColor: "default",
          defaultHoverLabelBGColor: "#fff",
          labelHoverColor: "default",
          defaultLabelHoverColor: "#000",
          edgeHoverColor: "edge",
          edgeHoverSizeRatio: 1,
          defaultEdgeHoverColor: "#000",
          edgeHoverExtremities: !1,
          drawEdges: !0,
          drawNodes: !0,
          drawLabels: !0,
          drawEdgeLabels: !1,
          batchEdgesDrawing: !1,
          hideEdgesOnMove: !1,
          canvasEdgesBatchSize: 500,
          webglEdgesBatchSize: 1e3,
          scalingMode: "inside",
          sideMargin: 0,
          minEdgeSize: 0.5,
          maxEdgeSize: 1,
          minNodeSize: 1,
          maxNodeSize: 8,
          touchEnabled: !0,
          mouseEnabled: !0,
          mouseWheelEnabled: !0,
          doubleClickEnabled: !0,
          eventsEnabled: !0,
          zoomingRatio: 1.7,
          doubleClickZoomingRatio: 2.2,
          zoomMin: 0.0625,
          zoomMax: 2,
          mouseZoomDuration: 200,
          doubleClickZoomDuration: 200,
          mouseInertiaDuration: 200,
          mouseInertiaRatio: 3,
          touchInertiaDuration: 200,
          touchInertiaRatio: 3,
          doubleClickTimeout: 300,
          doubleTapTimeout: 300,
          dragTimeout: 200,
          autoResize: !0,
          autoRescale: !0,
          enableCamera: !0,
          enableHovering: !0,
          enableEdgeHovering: !1,
          edgeHoverPrecision: 5,
          rescaleIgnoreSize: !1,
          skipErrors: !1,
          nodesPowRatio: 0.5,
          edgesPowRatio: 0.5,
          animationsTime: 200,
        });
      }.call(this));
    }.call(window));
  },
  function (e, t) {
    (function () {
      !(function (e) {
        "use strict";
        var t,
          i = 0,
          s = ["ms", "moz", "webkit", "o"];
        for (t = 0; t < s.length && !e.requestAnimationFrame; t++)
          (e.requestAnimationFrame = e[s[t] + "RequestAnimationFrame"]),
            (e.cancelAnimationFrame =
              e[s[t] + "CancelAnimationFrame"] ||
              e[s[t] + "CancelRequestAnimationFrame"]);
        e.requestAnimationFrame ||
          (e.requestAnimationFrame = function (t, s) {
            var n = new Date().getTime(),
              r = Math.max(0, 16 - (n - i)),
              a = e.setTimeout(function () {
                t(n + r);
              }, r);
            return (i = n + r), a;
          }),
          e.cancelAnimationFrame ||
            (e.cancelAnimationFrame = function (e) {
              clearTimeout(e);
            }),
          Function.prototype.bind ||
            (Function.prototype.bind = function (e) {
              if ("function" != typeof this)
                throw new TypeError(
                  "Function.prototype.bind - what is trying to be bound is not callable"
                );
              var t,
                i,
                s = Array.prototype.slice.call(arguments, 1),
                n = this;
              return (
                (i = function () {
                  return n.apply(
                    this instanceof t && e ? this : e,
                    s.concat(Array.prototype.slice.call(arguments))
                  );
                }),
                ((t = function () {}).prototype = this.prototype),
                (i.prototype = new t()),
                i
              );
            });
      })(this);
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        if ("undefined" == typeof sigma) throw "sigma is not declared";
        var t,
          i = this;
        (sigma.utils = sigma.utils || {}),
          (sigma.utils.extend = function () {
            var e,
              t,
              i = {};
            for (e = arguments.length - 1; e >= 0; e--)
              for (t in arguments[e]) i[t] = arguments[e][t];
            return i;
          }),
          (sigma.utils.dateNow = function () {
            return Date.now ? Date.now() : new Date().getTime();
          }),
          (sigma.utils.pkg = function (e) {
            return (e || "").split(".").reduce(function (e, t) {
              return t in e ? e[t] : (e[t] = {});
            }, i);
          }),
          (sigma.utils.id =
            ((t = 0),
            function () {
              return ++t;
            }));
        var s = {};
        (sigma.utils.floatColor = function (e) {
          if (s[e]) return s[e];
          var t = e,
            i = 0,
            n = 0,
            r = 0;
          "#" === e[0]
            ? 3 === (e = e.slice(1)).length
              ? ((i = parseInt(e.charAt(0) + e.charAt(0), 16)),
                (n = parseInt(e.charAt(1) + e.charAt(1), 16)),
                (r = parseInt(e.charAt(2) + e.charAt(2), 16)))
              : ((i = parseInt(e.charAt(0) + e.charAt(1), 16)),
                (n = parseInt(e.charAt(2) + e.charAt(3), 16)),
                (r = parseInt(e.charAt(4) + e.charAt(5), 16)))
            : e.match(/^ *rgba? *\(/) &&
              ((i = +(e = e.match(
                /^ *rgba? *\( *([0-9]*) *, *([0-9]*) *, *([0-9]*) *(,.*)?\) *$/
              ))[1]),
              (n = +e[2]),
              (r = +e[3]));
          var a = 256 * i * 256 + 256 * n + r;
          return (s[t] = a), a;
        }),
          (sigma.utils.zoomTo = function (e, t, i, s, n) {
            var r,
              a,
              o,
              d = e.settings;
            (a = Math.max(
              d("zoomMin"),
              Math.min(d("zoomMax"), e.ratio * s)
            )) !== e.ratio &&
              ((o = {
                x: t * (1 - (s = a / e.ratio)) + e.x,
                y: i * (1 - s) + e.y,
                ratio: a,
              }),
              n && n.duration
                ? ((r = sigma.misc.animation.killAll(e)),
                  (n = sigma.utils.extend(n, {
                    easing: r ? "quadraticOut" : "quadraticInOut",
                  })),
                  sigma.misc.animation.camera(e, o, n))
                : (e.goTo(o), n && n.onComplete && n.onComplete()));
          }),
          (sigma.utils.getQuadraticControlPoint = function (e, t, i, s) {
            return {
              x: (e + i) / 2 + (s - t) / 4,
              y: (t + s) / 2 + (e - i) / 4,
            };
          }),
          (sigma.utils.getPointOnQuadraticCurve = function (
            e,
            t,
            i,
            s,
            n,
            r,
            a
          ) {
            return {
              x:
                Math.pow(1 - e, 2) * t +
                2 * (1 - e) * e * r +
                Math.pow(e, 2) * s,
              y:
                Math.pow(1 - e, 2) * i +
                2 * (1 - e) * e * a +
                Math.pow(e, 2) * n,
            };
          }),
          (sigma.utils.getPointOnBezierCurve = function (
            e,
            t,
            i,
            s,
            n,
            r,
            a,
            o,
            d
          ) {
            var h = Math.pow(1 - e, 3),
              l = 3 * e * Math.pow(1 - e, 2),
              g = 3 * Math.pow(e, 2) * (1 - e),
              c = Math.pow(e, 3);
            return {
              x: h * t + l * r + g * o + c * s,
              y: h * i + l * a + g * d + c * n,
            };
          }),
          (sigma.utils.getSelfLoopControlPoints = function (e, t, i) {
            return { x1: e - 7 * i, y1: t, x2: e, y2: t + 7 * i };
          }),
          (sigma.utils.getDistance = function (e, t, i, s) {
            return Math.sqrt(Math.pow(i - e, 2) + Math.pow(s - t, 2));
          }),
          (sigma.utils.getCircleIntersection = function (e, t, i, s, n, r) {
            var a, o, d, h, l, g, c, u, m;
            return (
              (o = s - e),
              (d = n - t),
              !((h = Math.sqrt(d * d + o * o)) > i + r) &&
                !(h < Math.abs(i - r)) &&
                ((m = t + (d * (a = (i * i - r * r + h * h) / (2 * h))) / h),
                {
                  xi:
                    (u = e + (o * a) / h) +
                    (g = ((l = Math.sqrt(i * i - a * a)) / h) * -d),
                  xi_prime: u - g,
                  yi: m + (c = o * (l / h)),
                  yi_prime: m - c,
                })
            );
          }),
          (sigma.utils.isPointOnSegment = function (e, t, i, s, n, r, a) {
            return (
              Math.abs((t - s) * (n - i) - (e - i) * (r - s)) /
                sigma.utils.getDistance(i, s, n, r) <
                a &&
              Math.min(i, n) <= e &&
              e <= Math.max(i, n) &&
              Math.min(s, r) <= t &&
              t <= Math.max(s, r)
            );
          }),
          (sigma.utils.isPointOnQuadraticCurve = function (
            e,
            t,
            i,
            s,
            n,
            r,
            a,
            o,
            d
          ) {
            var h = sigma.utils.getDistance(i, s, n, r);
            if (Math.abs(e - i) > h || Math.abs(t - s) > h) return !1;
            for (
              var l,
                g = 0.5,
                c =
                  sigma.utils.getDistance(e, t, i, s) <
                  sigma.utils.getDistance(e, t, n, r)
                    ? -0.01
                    : 0.01,
                u = 100,
                m = sigma.utils.getPointOnQuadraticCurve(g, i, s, n, r, a, o),
                f = sigma.utils.getDistance(e, t, m.x, m.y);
              u-- > 0 && g >= 0 && g <= 1 && f > d && (c > 0.001 || c < -0.001);

            )
              (l = f),
                (m = sigma.utils.getPointOnQuadraticCurve(g, i, s, n, r, a, o)),
                (f = sigma.utils.getDistance(e, t, m.x, m.y)) > l
                  ? (g += c = -c / 2)
                  : g + c < 0 || g + c > 1
                  ? ((c /= 2), (f = l))
                  : (g += c);
            return f < d;
          }),
          (sigma.utils.isPointOnBezierCurve = function (
            e,
            t,
            i,
            s,
            n,
            r,
            a,
            o,
            d,
            h,
            l
          ) {
            var g = sigma.utils.getDistance(i, s, a, o);
            if (Math.abs(e - i) > g || Math.abs(t - s) > g) return !1;
            for (
              var c,
                u = 0.5,
                m =
                  sigma.utils.getDistance(e, t, i, s) <
                  sigma.utils.getDistance(e, t, n, r)
                    ? -0.01
                    : 0.01,
                f = 100,
                p = sigma.utils.getPointOnBezierCurve(
                  u,
                  i,
                  s,
                  n,
                  r,
                  a,
                  o,
                  d,
                  h
                ),
                y = sigma.utils.getDistance(e, t, p.x, p.y);
              f-- > 0 && u >= 0 && u <= 1 && y > l && (m > 0.001 || m < -0.001);

            )
              (c = y),
                (p = sigma.utils.getPointOnBezierCurve(
                  u,
                  i,
                  s,
                  n,
                  r,
                  a,
                  o,
                  d,
                  h
                )),
                (y = sigma.utils.getDistance(e, t, p.x, p.y)) > c
                  ? (u += m = -m / 2)
                  : u + m < 0 || u + m > 1
                  ? ((m /= 2), (y = c))
                  : (u += m);
            return y < l;
          }),
          (sigma.utils.getX = function (t) {
            return (
              (t.offsetX !== e && t.offsetX) ||
              (t.layerX !== e && t.layerX) ||
              (t.clientX !== e && t.clientX)
            );
          }),
          (sigma.utils.getY = function (t) {
            return (
              (t.offsetY !== e && t.offsetY) ||
              (t.layerY !== e && t.layerY) ||
              (t.clientY !== e && t.clientY)
            );
          }),
          (sigma.utils.getPixelRatio = function () {
            var t = 1;
            return (
              window.screen.deviceXDPI !== e &&
              window.screen.logicalXDPI !== e &&
              window.screen.deviceXDPI > window.screen.logicalXDPI
                ? (t = window.screen.systemXDPI / window.screen.logicalXDPI)
                : window.devicePixelRatio !== e &&
                  (t = window.devicePixelRatio),
              t
            );
          }),
          (sigma.utils.getWidth = function (t) {
            var i = t.target.ownerSVGElement
              ? t.target.ownerSVGElement.width
              : t.target.width;
            return (
              ("number" == typeof i && i) ||
              (i !== e && i.baseVal !== e && i.baseVal.value)
            );
          }),
          (sigma.utils.getCenter = function (e) {
            var t =
              -1 !== e.target.namespaceURI.indexOf("svg")
                ? 1
                : sigma.utils.getPixelRatio();
            return {
              x: sigma.utils.getWidth(e) / (2 * t),
              y: sigma.utils.getHeight(e) / (2 * t),
            };
          }),
          (sigma.utils.mouseCoords = function (e, t, i) {
            return (
              (t = t || sigma.utils.getX(e)),
              (i = i || sigma.utils.getY(e)),
              {
                x: t - sigma.utils.getCenter(e).x,
                y: i - sigma.utils.getCenter(e).y,
                clientX: e.clientX,
                clientY: e.clientY,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
              }
            );
          }),
          (sigma.utils.getHeight = function (t) {
            var i = t.target.ownerSVGElement
              ? t.target.ownerSVGElement.height
              : t.target.height;
            return (
              ("number" == typeof i && i) ||
              (i !== e && i.baseVal !== e && i.baseVal.value)
            );
          }),
          (sigma.utils.getDelta = function (t) {
            return (
              (t.wheelDelta !== e && t.wheelDelta) ||
              (t.detail !== e && -t.detail)
            );
          }),
          (sigma.utils.getOffset = function (e) {
            for (var t = 0, i = 0; e; )
              (i += parseInt(e.offsetTop)),
                (t += parseInt(e.offsetLeft)),
                (e = e.offsetParent);
            return { top: i, left: t };
          }),
          (sigma.utils.doubleClick = function (e, t, i) {
            var s,
              n = 0;
            (e._doubleClickHandler = e._doubleClickHandler || {}),
              (e._doubleClickHandler[t] = e._doubleClickHandler[t] || []),
              (s = e._doubleClickHandler[t]).push(function (e) {
                if (2 === ++n) return (n = 0), i(e);
                1 === n &&
                  setTimeout(function () {
                    n = 0;
                  }, sigma.settings.doubleClickTimeout);
              }),
              e.addEventListener(t, s[s.length - 1], !1);
          }),
          (sigma.utils.unbindDoubleClick = function (e, t) {
            for (
              var i, s = (e._doubleClickHandler || {})[t] || [];
              (i = s.pop());

            )
              e.removeEventListener(t, i);
            delete (e._doubleClickHandler || {})[t];
          }),
          (sigma.utils.easings = sigma.utils.easings || {}),
          (sigma.utils.easings.linearNone = function (e) {
            return e;
          }),
          (sigma.utils.easings.quadraticIn = function (e) {
            return e * e;
          }),
          (sigma.utils.easings.quadraticOut = function (e) {
            return e * (2 - e);
          }),
          (sigma.utils.easings.quadraticInOut = function (e) {
            return (e *= 2) < 1 ? 0.5 * e * e : -0.5 * (--e * (e - 2) - 1);
          }),
          (sigma.utils.easings.cubicIn = function (e) {
            return e * e * e;
          }),
          (sigma.utils.easings.cubicOut = function (e) {
            return --e * e * e + 1;
          }),
          (sigma.utils.easings.cubicInOut = function (e) {
            return (e *= 2) < 1
              ? 0.5 * e * e * e
              : 0.5 * ((e -= 2) * e * e + 2);
          }),
          (sigma.utils.loadShader = function (e, t, i, s) {
            var n = e.createShader(i);
            return (
              e.shaderSource(n, t),
              e.compileShader(n),
              e.getShaderParameter(n, e.COMPILE_STATUS)
                ? n
                : (s &&
                    s(
                      'Error compiling shader "' +
                        n +
                        '":' +
                        e.getShaderInfoLog(n)
                    ),
                  e.deleteShader(n),
                  null)
            );
          }),
          (sigma.utils.loadProgram = function (e, t, i, s, n) {
            var r,
              a = e.createProgram();
            for (r = 0; r < t.length; ++r) e.attachShader(a, t[r]);
            if (i)
              for (r = 0; r < i.length; ++r)
                e.bindAttribLocation(
                  a,
                  locations ? locations[r] : r,
                  opt_attribs[r]
                );
            return (
              e.linkProgram(a),
              e.getProgramParameter(a, e.LINK_STATUS)
                ? a
                : (n &&
                    n("Error in program linking: " + e.getProgramInfoLog(a)),
                  e.deleteProgram(a),
                  null)
            );
          }),
          sigma.utils.pkg("sigma.utils.matrices"),
          (sigma.utils.matrices.translation = function (e, t) {
            return [1, 0, 0, 0, 1, 0, e, t, 1];
          }),
          (sigma.utils.matrices.rotation = function (e, t) {
            var i = Math.cos(e),
              s = Math.sin(e);
            return t ? [i, -s, s, i] : [i, -s, 0, s, i, 0, 0, 0, 1];
          }),
          (sigma.utils.matrices.scale = function (e, t) {
            return t ? [e, 0, 0, e] : [e, 0, 0, 0, e, 0, 0, 0, 1];
          }),
          (sigma.utils.matrices.multiply = function (e, t, i) {
            var s = i ? 2 : 3,
              n = e[0 * s + 0],
              r = e[0 * s + 1],
              a = e[0 * s + 2],
              o = e[1 * s + 0],
              d = e[1 * s + 1],
              h = e[1 * s + 2],
              l = e[2 * s + 0],
              g = e[2 * s + 1],
              c = e[2 * s + 2],
              u = t[0 * s + 0],
              m = t[0 * s + 1],
              f = t[0 * s + 2],
              p = t[1 * s + 0],
              y = t[1 * s + 1],
              x = t[1 * s + 2],
              v = t[2 * s + 0],
              b = t[2 * s + 1],
              w = t[2 * s + 2];
            return i
              ? [n * u + r * p, n * m + r * y, o * u + d * p, o * m + d * y]
              : [
                  n * u + r * p + a * v,
                  n * m + r * y + a * b,
                  n * f + r * x + a * w,
                  o * u + d * p + h * v,
                  o * m + d * y + h * b,
                  o * f + d * x + h * w,
                  l * u + g * p + c * v,
                  l * m + g * y + c * b,
                  l * f + g * x + c * w,
                ];
          });
      }.call(this));
    }.call(window));
  },
  function (e, t, i) {
    (function () {
      !(function (i) {
        "use strict";
        if (i.conrad) throw new Error("conrad already exists");
        var s,
          n = !1,
          r = {},
          a = {},
          o = [],
          d = {},
          h = [],
          l = !1,
          g = { frameDuration: 20, history: !0 },
          c = Object.create(null);
        function u(e, t) {
          var i,
            s,
            n,
            r,
            a,
            o,
            d = Array.isArray(e) ? e : e.split(/ /);
          for (t = void 0 === t ? {} : t, i = 0, n = d.length; i !== n; i += 1)
            if (((o = d[i]), c[o]))
              for (
                a = { type: o, data: t || {} }, s = 0, r = c[o].length;
                s !== r;
                s += 1
              )
                try {
                  c[o][s].handler(a);
                } catch (e) {}
        }
        function m() {
          var e,
            t,
            i,
            s,
            n = !1,
            r = E(),
            a = o.shift();
          if (
            ((i = a.job()),
            (r = E() - r),
            a.done++,
            (a.time += r),
            (a.currentTime += r),
            (a.weightTime = a.currentTime / (a.weight || 1)),
            (a.averageTime = a.time / a.done),
            !(s = a.count ? a.count <= a.done : !i))
          ) {
            for (e = 0, t = o.length; e < t; e++)
              if (o[e].weightTime > a.weightTime) {
                o.splice(e, 0, a), (n = !0);
                break;
              }
            n || o.push(a);
          }
          return s ? a : null;
        }
        function f(e) {
          var t = o.length;
          (a[e.id] = e),
            (e.status = "running"),
            t &&
              ((e.weightTime = o[t - 1].weightTime),
              (e.currentTime = e.weightTime * (e.weight || 1))),
            (e.startTime = E()),
            u("jobStarted", b(e)),
            o.push(e);
        }
        function p() {
          var e, t, i;
          for (e in r) (t = r[e]).after ? (d[e] = t) : f(t), delete r[e];
          for (n = !!o.length; o.length && E() - s < g.frameDuration; )
            if ((i = m()))
              for (e in (y(i.id), d))
                d[e].after === i.id && (f(d[e]), delete d[e]);
          n ? ((s = E()), u("enterFrame"), setTimeout(p, 0)) : u("stop");
        }
        function y(e) {
          var t,
            i,
            s,
            n,
            l = !1;
          if (Array.isArray(e)) for (t = 0, i = e.length; t < i; t++) y(e[t]);
          else {
            if ("string" != typeof e)
              throw new Error("[conrad.killJob] Wrong arguments.");
            for (t = 0, i = (s = [a, d, r]).length; t < i; t++)
              e in s[t] &&
                ((n = s[t][e]),
                g.history && ((n.status = "done"), h.push(n)),
                u("jobEnded", b(n)),
                delete s[t][e],
                "function" == typeof n.end && n.end(),
                (l = !0));
            for (t = 0, i = (s = o).length; t < i; t++)
              if (s[t].id === e) {
                s.splice(t, 1);
                break;
              }
            if (!l)
              throw new Error('[conrad.killJob] Job "' + e + '" not found.');
          }
          return this;
        }
        function x(e) {
          var t = r[e] || a[e] || d[e];
          return t ? v(t) : null;
        }
        function v() {
          var e,
            t,
            i = {};
          for (e = arguments.length - 1; e >= 0; e--)
            for (t in arguments[e]) i[t] = arguments[e][t];
          return i;
        }
        function b(e) {
          var t, i, s;
          if (!e) return e;
          if (Array.isArray(e))
            for (t = [], i = 0, s = e.length; i < s; i++) t.push(b(e[i]));
          else if ("object" == typeof e)
            for (i in ((t = {}), e)) t[i] = b(e[i]);
          else t = e;
          return t;
        }
        function w(e) {
          var t,
            i = [];
          for (t in e) i.push(e[t]);
          return i;
        }
        function E() {
          return Date.now ? Date.now() : new Date().getTime();
        }
        Array.isArray ||
          (Array.isArray = function (e) {
            return "[object Array]" === Object.prototype.toString.call(e);
          });
        var C = {
          hasJob: x,
          addJob: function e(t, i) {
            var a, o, d;
            if (Array.isArray(t)) {
              for (l = !0, a = 0, o = t.length; a < o; a++)
                e(t[a].id, v(t[a], i));
              (l = !1), n || ((s = E()), u("start"), p());
            } else if ("object" == typeof t)
              if ("string" == typeof t.id) e(t.id, t);
              else {
                for (a in ((l = !0), t))
                  "function" == typeof t[a]
                    ? e(a, v({ job: t[a] }, i))
                    : e(a, v(t[a], i));
                (l = !1), n || ((s = E()), u("start"), p());
              }
            else {
              if ("string" != typeof t)
                throw new Error("[conrad.addJob] Wrong arguments.");
              if (x(t))
                throw new Error(
                  '[conrad.addJob] Job with id "' + t + '" already exists.'
                );
              if ("function" == typeof i)
                d = {
                  id: t,
                  done: 0,
                  time: 0,
                  status: "waiting",
                  currentTime: 0,
                  averageTime: 0,
                  weightTime: 0,
                  job: i,
                };
              else {
                if ("object" != typeof i)
                  throw new Error("[conrad.addJob] Wrong arguments.");
                d = v(
                  {
                    id: t,
                    done: 0,
                    time: 0,
                    status: "waiting",
                    currentTime: 0,
                    averageTime: 0,
                    weightTime: 0,
                  },
                  i
                );
              }
              (r[t] = d),
                u("jobAdded", b(d)),
                n || l || ((s = E()), u("start"), p());
            }
            return this;
          },
          killJob: y,
          killAll: function () {
            var e,
              t = v(r, a, d);
            if (g.history)
              for (e in t)
                (t[e].status = "done"),
                  h.push(t[e]),
                  "function" == typeof t[e].end && t[e].end();
            return (r = {}), (d = {}), (a = {}), (o = []), (n = !1), this;
          },
          settings: function (e, t) {
            var i;
            if ("string" == typeof a1 && 1 === arguments.length) return g[a1];
            for (var s in ((i =
              ("object" == typeof a1 && 1 === arguments.length && a1) || {}),
            "string" == typeof a1 && (i[a1] = a2),
            i))
              void 0 !== i[s] ? (g[s] = i[s]) : delete g[s];
            return this;
          },
          getStats: function (e, t) {
            var i, s, n, o, l, g, c;
            if (!arguments.length) {
              for (s in ((l = []), r)) l.push(r[s]);
              for (s in d) l.push(d[s]);
              for (s in a) l.push(a[s]);
              l = l.concat(h);
            }
            if ("string" == typeof e)
              switch (e) {
                case "waiting":
                  l = w(d);
                  break;
                case "running":
                  l = w(a);
                  break;
                case "done":
                  l = h;
                  break;
                default:
                  g = e;
              }
            if (
              (e instanceof RegExp && (g = e),
              !g && ("string" == typeof t || t instanceof RegExp) && (g = t),
              g)
            ) {
              if (((c = "string" == typeof g), l instanceof Array)) i = l;
              else if ("object" == typeof l)
                for (s in ((i = []), l)) i = i.concat(l[s]);
              else {
                for (s in ((i = []), r)) i.push(r[s]);
                for (s in d) i.push(d[s]);
                for (s in a) i.push(a[s]);
                i = i.concat(h);
              }
              for (l = [], n = 0, o = i.length; n < o; n++)
                (c ? i[n].id === g : i[n].id.match(g)) && l.push(i[n]);
            }
            return b(l);
          },
          isRunning: function () {
            return n;
          },
          clearHistory: function () {
            return (h = []), this;
          },
          bind: function e(t, i) {
            var s, n, r, a;
            if (arguments.length)
              if (
                1 === arguments.length &&
                Object(arguments[0]) === arguments[0]
              )
                for (t in arguments[0]) e(t, arguments[0][t]);
              else if (arguments.length > 1)
                for (
                  s = 0, n = (a = Array.isArray(t) ? t : t.split(/ /)).length;
                  s !== n;
                  s += 1
                )
                  (r = a[s]), c[r] || (c[r] = []), c[r].push({ handler: i });
          },
          unbind: function (e, t) {
            var i,
              s,
              n,
              r,
              a,
              o,
              d = Array.isArray(e) ? e : e.split(/ /);
            if (arguments.length)
              if (t)
                for (i = 0, s = d.length; i !== s; i += 1) {
                  if (((o = d[i]), c[o])) {
                    for (a = [], n = 0, r = c[o].length; n !== r; n += 1)
                      c[o][n].handler !== t && a.push(c[o][n]);
                    c[o] = a;
                  }
                  c[o] && 0 === c[o].length && delete c[o];
                }
              else for (i = 0, s = d.length; i !== s; i += 1) delete c[d[i]];
            else c = Object.create(null);
          },
          version: "0.1.0",
        };
        void 0 !== e && e.exports && (t = e.exports = C),
          (t.conrad = C),
          (i.conrad = C);
      })(this);
    }.call(window));
  },
  function (e, t) {
    (function () {
      (function (e) {
        "use strict";
        var t = {},
          i = function (e) {
            var s, n, r, a, o;
            i.classes.dispatcher.extend(this);
            var d = this,
              h = e || {};
            if (
              ("string" == typeof h || h instanceof HTMLElement
                ? (h = { renderers: [h] })
                : "[object Array]" === Object.prototype.toString.call(h) &&
                  (h = { renderers: h }),
              (a = h.renderers || h.renderer || h.container),
              (h.renderers && 0 !== h.renderers.length) ||
                (("string" == typeof a ||
                  a instanceof HTMLElement ||
                  ("object" == typeof a && "container" in a)) &&
                  (h.renderers = [a])),
              h.id)
            ) {
              if (t[h.id])
                throw 'sigma: Instance "' + h.id + '" already exists.';
              Object.defineProperty(this, "id", { value: h.id });
            } else {
              for (o = 0; t[o]; ) o++;
              Object.defineProperty(this, "id", { value: "" + o });
            }
            for (
              t[this.id] = this,
                this.settings = new i.classes.configurable(
                  i.settings,
                  h.settings || {}
                ),
                Object.defineProperty(this, "graph", {
                  value: new i.classes.graph(this.settings),
                  configurable: !0,
                }),
                Object.defineProperty(this, "middlewares", {
                  value: [],
                  configurable: !0,
                }),
                Object.defineProperty(this, "cameras", {
                  value: {},
                  configurable: !0,
                }),
                Object.defineProperty(this, "renderers", {
                  value: {},
                  configurable: !0,
                }),
                Object.defineProperty(this, "renderersPerCamera", {
                  value: {},
                  configurable: !0,
                }),
                Object.defineProperty(this, "cameraFrames", {
                  value: {},
                  configurable: !0,
                }),
                Object.defineProperty(this, "camera", {
                  get: function () {
                    return this.cameras[0];
                  },
                }),
                Object.defineProperty(this, "events", {
                  value: [
                    "click",
                    "rightClick",
                    "clickStage",
                    "doubleClickStage",
                    "rightClickStage",
                    "clickNode",
                    "clickNodes",
                    "doubleClickNode",
                    "doubleClickNodes",
                    "rightClickNode",
                    "rightClickNodes",
                    "overNode",
                    "overNodes",
                    "outNode",
                    "outNodes",
                    "downNode",
                    "downNodes",
                    "upNode",
                    "upNodes",
                  ],
                  configurable: !0,
                }),
                this._handler = function (e) {
                  var t,
                    i = {};
                  for (t in e.data) i[t] = e.data[t];
                  (i.renderer = e.target), this.dispatchEvent(e.type, i);
                }.bind(this),
                s = 0,
                n = (r = h.renderers || []).length;
              s < n;
              s++
            )
              this.addRenderer(r[s]);
            for (s = 0, n = (r = h.middlewares || []).length; s < n; s++)
              this.middlewares.push(
                "string" == typeof r[s] ? i.middlewares[r[s]] : r[s]
              );
            "object" == typeof h.graph &&
              h.graph &&
              (this.graph.read(h.graph), this.refresh()),
              window.addEventListener("resize", function () {
                d.settings && d.refresh();
              });
          };
        if (
          ((i.prototype.addCamera = function (t) {
            var s,
              n = this;
            if (!arguments.length) {
              for (t = 0; this.cameras["" + t]; ) t++;
              t = "" + t;
            }
            if (this.cameras[t])
              throw 'sigma.addCamera: The camera "' + t + '" already exists.';
            return (
              (s = new i.classes.camera(t, this.graph, this.settings)),
              (this.cameras[t] = s),
              (s.quadtree = new i.classes.quad()),
              i.classes.edgequad !== e &&
                (s.edgequadtree = new i.classes.edgequad()),
              s.bind("coordinatesUpdated", function (e) {
                n.renderCamera(s, s.isAnimated);
              }),
              (this.renderersPerCamera[t] = []),
              s
            );
          }),
          (i.prototype.killCamera = function (e) {
            if (!(e = "string" == typeof e ? this.cameras[e] : e))
              throw "sigma.killCamera: The camera is undefined.";
            var t,
              i = this.renderersPerCamera[e.id];
            for (t = i.length - 1; t >= 0; t--) this.killRenderer(i[t]);
            return (
              delete this.renderersPerCamera[e.id],
              delete this.cameraFrames[e.id],
              delete this.cameras[e.id],
              e.kill && e.kill(),
              this
            );
          }),
          (i.prototype.addRenderer = function (e) {
            var t,
              s,
              n,
              r,
              a = e || {};
            if (
              ("string" == typeof a
                ? (a = { container: document.getElementById(a) })
                : a instanceof HTMLElement && (a = { container: a }),
              "string" == typeof a.container &&
                (a.container = document.getElementById(a.container)),
              "id" in a)
            )
              t = a.id;
            else {
              for (t = 0; this.renderers["" + t]; ) t++;
              t = "" + t;
            }
            if (this.renderers[t])
              throw (
                'sigma.addRenderer: The renderer "' + t + '" already exists.'
              );
            if (
              ((s =
                (s =
                  "function" == typeof a.type ? a.type : i.renderers[a.type]) ||
                i.renderers.def),
              (n =
                "camera" in a
                  ? a.camera instanceof i.classes.camera
                    ? a.camera
                    : this.cameras[a.camera] || this.addCamera(a.camera)
                  : this.addCamera()),
              this.cameras[n.id] !== n)
            )
              throw "sigma.addRenderer: The camera is not properly referenced.";
            return (
              (r = new s(this.graph, n, this.settings, a)),
              (this.renderers[t] = r),
              Object.defineProperty(r, "id", { value: t }),
              r.bind &&
                r.bind(
                  [
                    "click",
                    "rightClick",
                    "clickStage",
                    "doubleClickStage",
                    "rightClickStage",
                    "clickNode",
                    "clickNodes",
                    "clickEdge",
                    "clickEdges",
                    "doubleClickNode",
                    "doubleClickNodes",
                    "doubleClickEdge",
                    "doubleClickEdges",
                    "rightClickNode",
                    "rightClickNodes",
                    "rightClickEdge",
                    "rightClickEdges",
                    "overNode",
                    "overNodes",
                    "overEdge",
                    "overEdges",
                    "outNode",
                    "outNodes",
                    "outEdge",
                    "outEdges",
                    "downNode",
                    "downNodes",
                    "downEdge",
                    "downEdges",
                    "upNode",
                    "upNodes",
                    "upEdge",
                    "upEdges",
                  ],
                  this._handler
                ),
              this.renderersPerCamera[n.id].push(r),
              r
            );
          }),
          (i.prototype.killRenderer = function (e) {
            if (!(e = "string" == typeof e ? this.renderers[e] : e))
              throw "sigma.killRenderer: The renderer is undefined.";
            var t = this.renderersPerCamera[e.camera.id],
              i = t.indexOf(e);
            return (
              i >= 0 && t.splice(i, 1),
              e.kill && e.kill(),
              delete this.renderers[e.id],
              this
            );
          }),
          (i.prototype.refresh = function (t) {
            var s,
              n,
              r,
              a,
              o,
              d,
              h = 0;
            for (
              t = t || {}, s = 0, n = (a = this.middlewares || []).length;
              s < n;
              s++
            )
              a[s].call(
                this,
                0 === s ? "" : "tmp" + h + ":",
                s === n - 1 ? "ready:" : "tmp" + ++h + ":"
              );
            for (r in this.cameras)
              (o = this.cameras[r]).settings("autoRescale") &&
              this.renderersPerCamera[o.id] &&
              this.renderersPerCamera[o.id].length
                ? i.middlewares.rescale.call(
                    this,
                    a.length ? "ready:" : "",
                    o.readPrefix,
                    {
                      width: this.renderersPerCamera[o.id][0].width,
                      height: this.renderersPerCamera[o.id][0].height,
                    }
                  )
                : i.middlewares.copy.call(
                    this,
                    a.length ? "ready:" : "",
                    o.readPrefix
                  ),
                t.skipIndexation ||
                  ((d = i.utils.getBoundaries(this.graph, o.readPrefix)),
                  o.quadtree.index(this.graph.nodes(), {
                    prefix: o.readPrefix,
                    bounds: {
                      x: d.minX,
                      y: d.minY,
                      width: d.maxX - d.minX,
                      height: d.maxY - d.minY,
                    },
                  }),
                  o.edgequadtree !== e &&
                    o.settings("drawEdges") &&
                    o.settings("enableEdgeHovering") &&
                    o.edgequadtree.index(this.graph, {
                      prefix: o.readPrefix,
                      bounds: {
                        x: d.minX,
                        y: d.minY,
                        width: d.maxX - d.minX,
                        height: d.maxY - d.minY,
                      },
                    }));
            for (
              s = 0, n = (a = Object.keys(this.renderers)).length;
              s < n;
              s++
            )
              if (this.renderers[a[s]].process)
                if (this.settings("skipErrors"))
                  try {
                    this.renderers[a[s]].process();
                  } catch (e) {
                    console.log(
                      'Warning: The renderer "' +
                        a[s] +
                        '" crashed on ".process()"'
                    );
                  }
                else this.renderers[a[s]].process();
            return this.render(), this;
          }),
          (i.prototype.render = function () {
            var e, t, i;
            for (
              e = 0, t = (i = Object.keys(this.renderers)).length;
              e < t;
              e++
            )
              if (this.settings("skipErrors"))
                try {
                  this.renderers[i[e]].render();
                } catch (t) {
                  this.settings("verbose") &&
                    console.log(
                      'Warning: The renderer "' +
                        i[e] +
                        '" crashed on ".render()"'
                    );
                }
              else this.renderers[i[e]].render();
            return this;
          }),
          (i.prototype.renderCamera = function (e, t) {
            var i,
              s,
              n,
              r = this;
            if (t)
              for (
                i = 0, s = (n = this.renderersPerCamera[e.id]).length;
                i < s;
                i++
              )
                if (this.settings("skipErrors"))
                  try {
                    n[i].render();
                  } catch (e) {
                    this.settings("verbose") &&
                      console.log(
                        'Warning: The renderer "' +
                          n[i].id +
                          '" crashed on ".render()"'
                      );
                  }
                else n[i].render();
            else if (!this.cameraFrames[e.id]) {
              for (
                i = 0, s = (n = this.renderersPerCamera[e.id]).length;
                i < s;
                i++
              )
                if (this.settings("skipErrors"))
                  try {
                    n[i].render();
                  } catch (e) {
                    this.settings("verbose") &&
                      console.log(
                        'Warning: The renderer "' +
                          n[i].id +
                          '" crashed on ".render()"'
                      );
                  }
                else n[i].render();
              this.cameraFrames[e.id] = requestAnimationFrame(function () {
                delete r.cameraFrames[e.id];
              });
            }
            return this;
          }),
          (i.prototype.kill = function () {
            var e;
            for (e in (this.dispatchEvent("kill"),
            this.graph.kill(),
            delete this.middlewares,
            this.renderers))
              this.killRenderer(this.renderers[e]);
            for (e in this.cameras) this.killCamera(this.cameras[e]);
            for (e in (delete this.renderers, delete this.cameras, this))
              this.hasOwnProperty(e) && delete this[e];
            delete t[this.id];
          }),
          (i.instances = function (e) {
            return arguments.length ? t[e] : i.utils.extend({}, t);
          }),
          (i.version = "1.2.1"),
          void 0 !== this.sigma)
        )
          throw "An object called sigma is already in the global scope.";
        this.sigma = i;
      }.call(this));
    }.call(window));
  },
]);
