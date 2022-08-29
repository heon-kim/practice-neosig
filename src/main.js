import { showHistory } from "./showHistory.js";

var neo4jConfig = {
  url: "bolt://localhost:7687",
  user: "neo4j",
  password: "1234",
};

var style = {
  labels: {
    User: {
      label: "userID",
      color: "#654321",
      size: 8,
      icon: {
        name: "f007",
        color: "#FFF",
        scale: 1.0,
      },
    },
    Doc: {
      label: "docID",
      color: "#123456",
      size: 8,
      icon: {
        name: "f15b",
        color: "#FFF",
        scale: 1.0,
      },
    },
    Site: {
      label: "site",
      color: "#123456",
      size: 8,
      icon: {
        name: "f019",
        color: "#FFF",
        scale: 1.0,
      },
    },
  },
  edges: {
    연관: {
      color: "#040404",
      size: 1,
    },
    다운로드: {
      color: "#040404",
      size: 1,
    },
    다운로드문서: {
      color: "#040404",
      size: 1,
    },
  },
};

Neo4jGraph(neo4jConfig, style, "MATCH (n)-[r]-(m) RETURN n,r,m limit 15").then(
  function (result) {
    var sig = new sigma({
      graph: result,
      renderer: {
        container: "graph-container",
        type: "canvas",
      },
      settings: {
        edgeLabelThreshold: 1,
        drawEdgeLabels: true,
        edgeLabelSize: "fixed",
        defaultEdgeLabelSize: 8,
        enableEdgeHovering: true,
        edgeHoverExtremities: true,
        autoRescale: true,
        minEdgeSize: 1,
        maxEdgeSize: 5,
        minNodeSize: 1,
        maxNodeSize: 20,
      },
    });

    var docID;
    sig.bind("clickNode", function (e) {
      var nodeLabel = e.data.node.labels[0];
      var nodeProperty = e.data.node.properties;
      $("#taskpane-properties").empty();
      $("#historyList").empty();
      if (nodeProperty) {
        for (var key in nodeProperty) {
          $("#taskpane-properties").append(
            " <li>" + key + " : " + nodeProperty[key] + "</li>"
          );
          if (key === "docID") {
            docID = nodeProperty[key];
            console.log("[docID]", docID);
          }
        }
      } else {
        $("#taskpane-properties").append("노드 속성이 지정되지 않았습니다.");
      }
      if (nodeLabel === "Doc") {
        showHistory(docID);
      }
    });

    // start layout
    sig.startForceAtlas2();
    setTimeout(() => {
      sig.stopForceAtlas2();
    }, Math.log(result.nodes.length * result.edges.length) * 1000);
  }
);
