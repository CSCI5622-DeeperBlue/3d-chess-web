module BABYLON {
    // Unique ID when we import meshes from Babylon to CSG
    var currentCSGMeshId = 0;

    // # class Vertex

    // Represents a vertex of a polygon. Use your own vertex class instead of this
    // one to provide additional features like texture coordinates and vertex
    // colors. Custom vertex classes need to provide a `pos` property and `clone()`,
    // `flip()`, and `interpolate()` methods that behave analogous to the ones
    // defined by `BABYLON.CSG.Vertex`. This class provides `normal` so convenience
    // functions like `BABYLON.CSG.sphere()` can return a smooth vertex normal, but `normal`
    // is not used anywhere else. 
    // Same goes for uv, it allows to keep the original vertex uv coordinates of the 2 meshes
    class Vertex {
        constructor(public pos: Vector3, public normal: Vector3, public uv: Vector2) {
        }

        public clone(): Vertex {
            return new Vertex(this.pos.clone(), this.normal.clone(), this.uv.clone());
        }

        // Invert all orientation-specific data (e.g. vertex normal). Called when the
        // orientation of a polygon is flipped.
        public flip(): void {
            this.normal = this.normal.scale(-1);
        }

        // Create a new vertex between this vertex and `other` by linearly
        // interpolating all properties using a parameter of `t`. Subclasses should
        // override this to interpolate additional properties.
        public interpolate(other, t): Vertex {
            return new Vertex(Vector3.Lerp(this.pos, other.pos, t),
                Vector3.Lerp(this.normal, other.normal, t),
                Vector2.Lerp(this.uv, other.uv, t)
                );
        }
    }

    // # class Plane

    // Represents a plane in 3D space.
    class Plane {
        constructor(public normal: Vector3, public w: number) {
        }

        // `BABYLON.CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
        // point is on the plane.
        static EPSILON = 1e-5;

        public static FromPoints(a: Vector3, b: Vector3, c: Vector3): Plane {
            var v0 = c.subtract(a);
            var v1 = b.subtract(a);

            if (v0.lengthSquared() === 0 || v1.lengthSquared() === 0) {
                return null;
            }

            var n = Vector3.Normalize(Vector3.Cross(v0, v1));
            return new Plane(n, Vector3.Dot(n, a));
        }

        public clone(): Plane {
            return new Plane(this.normal.clone(), this.w);
        }

        public flip() {
            this.normal.scaleInPlace(-1);
            this.w = -this.w;
        }

        // Split `polygon` by this plane if needed, then put the polygon or polygon
        // fragments in the appropriate lists. Coplanar polygons go into either
        // `coplanarFront` or `coplanarBack` depending on their orientation with
        // respect to this plane. Polygons in front or in back of this plane go into
        // either `front` or `back`.
        public splitPolygon(polygon: Polygon, coplanarFront: Polygon[], coplanarBack: Polygon[], front: Polygon[], back: Polygon[]): void {
            var COPLANAR = 0;
            var FRONT = 1;
            var BACK = 2;
            var SPANNING = 3;

            // Classify each point as well as the entire polygon into one of the above
            // four classes.
            var polygonType = 0;
            var types = [];
            var i: number;
            var t: number;
            for (i = 0; i < polygon.vertices.length; i++) {
                t = Vector3.Dot(this.normal, polygon.vertices[i].pos) - this.w;
                var type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON) ? FRONT : COPLANAR;
                polygonType |= type;
                types.push(type);
            }

            // Put the polygon in the correct list, splitting it when necessary.
            switch (polygonType) {
                case COPLANAR:
                    (Vector3.Dot(this.normal, polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                    break;
                case FRONT:
                    front.push(polygon);
                    break;
                case BACK:
                    back.push(polygon);
                    break;
                case SPANNING:
                    var f = [], b = [];
                    for (i = 0; i < polygon.vertices.length; i++) {
                        var j = (i + 1) % polygon.vertices.length;
                        var ti = types[i], tj = types[j];
                        var vi = polygon.vertices[i], vj = polygon.vertices[j];
                        if (ti !== BACK) f.push(vi);
                        if (ti !== FRONT) b.push(ti !== BACK ? vi.clone() : vi);
                        if ((ti | tj) === SPANNING) {
                            t = (this.w - Vector3.Dot(this.normal, vi.pos)) / Vector3.Dot(this.normal, vj.pos.subtract(vi.pos));
                            var v = vi.interpolate(vj, t);
                            f.push(v);
                            b.push(v.clone());
                        }
                    }
                    var poly: Polygon;
                    if (f.length >= 3) {
                        poly = new Polygon(f, polygon.shared);
                        if (poly.plane)
                            front.push(poly);
                    }

                    if (b.length >= 3) {
                        poly = new Polygon(b, polygon.shared);

                        if (poly.plane)
                            back.push(poly);
                    }

                    break;
            }
        }
    }

    // # class Polygon

    // Represents a convex polygon. The vertices used to initialize a polygon must
    // be coplanar and form a convex loop.
    // 
    // Each convex polygon has a `shared` property, which is shared between all
    // polygons that are clones of each other or were split from the same polygon.
    // This can be used to define per-polygon properties (such as surface color).
    class Polygon {
        public vertices: Vertex[];
        public shared;
        public plane: Plane;

        constructor(vertices: Vertex[], shared) {
            this.vertices = vertices;
            this.shared = shared;
            this.plane = Plane.FromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);

        }

        public clone(): Polygon {
            var vertices = this.vertices.map(v => v.clone());
            return new Polygon(vertices, this.shared);
        }

        public flip() {
            this.vertices.reverse().map(v => { v.flip(); });
            this.plane.flip();
        }
    }

    // # class Node

    // Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
    // by picking a polygon to split along. That polygon (and all other coplanar
    // polygons) are added directly to that node and the other polygons are added to
    // the front and/or back subtrees. This is not a leafy BSP tree since there is
    // no distinction between internal and leaf nodes.
    class Node {
        private plane = null;
        private front = null;
        private back = null;
        private polygons = [];

        constructor(polygons?) {
            if (polygons) {
                this.build(polygons);
            }
        }

        public clone(): Node {
            var node = new Node();
            node.plane = this.plane && this.plane.clone();
            node.front = this.front && this.front.clone();
            node.back = this.back && this.back.clone();
            node.polygons = this.polygons.map(p => p.clone());
            return node;
        }

        // Convert solid space to empty space and empty space to solid space.
        public invert(): void {
            for (var i = 0; i < this.polygons.length; i++) {
                this.polygons[i].flip();
            }
            if (this.plane) {
                this.plane.flip();
            }
            if (this.front) {
                this.front.invert();
            }
            if (this.back) {
                this.back.invert();
            }
            var temp = this.front;
            this.front = this.back;
            this.back = temp;
        }

        // Recursively remove all polygons in `polygons` that are inside this BSP
        // tree.
        clipPolygons(polygons: Polygon[]) {
            if (!this.plane) return polygons.slice();
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], front, back, front, back);
            }
            if (this.front) {
                front = this.front.clipPolygons(front);
            }
            if (this.back) {
                back = this.back.clipPolygons(back);
            } else {
                back = [];
            }
            return front.concat(back);
        }

        // Remove all polygons in this BSP tree that are inside the other BSP tree
        // `bsp`.
        clipTo(bsp: Node): void {
            this.polygons = bsp.clipPolygons(this.polygons);
            if (this.front) this.front.clipTo(bsp);
            if (this.back) this.back.clipTo(bsp);
        }

        // Return a list of all polygons in this BSP tree.
        allPolygons(): Polygon[] {
            var polygons = this.polygons.slice();
            if (this.front) polygons = polygons.concat(this.front.allPolygons());
            if (this.back) polygons = polygons.concat(this.back.allPolygons());
            return polygons;
        }

        // Build a BSP tree out of `polygons`. When called on an existing tree, the
        // new polygons are filtered down to the bottom of the tree and become new
        // nodes there. Each set of polygons is partitioned using the first polygon
        // (no heuristic is used to pick a good split).
        build(polygons: Polygon[]) {
            if (!polygons.length) return;
            if (!this.plane) this.plane = polygons[0].plane.clone();
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
            }
            if (front.length) {
                if (!this.front) this.front = new Node();
                this.front.build(front);
            }
            if (back.length) {
                if (!this.back) this.back = new Node();
                this.back.build(back);
            }
        }
    }

    export class CSG {
        private polygons = new Array<Polygon>();
        public matrix: Matrix;
        public position: Vector3;
        public rotation: Vector3;
        public rotationQuaternion: Quaternion;
        public scaling: Vector3;

        // Convert BABYLON.Mesh to BABYLON.CSG
        public static FromMesh(mesh: Mesh): CSG {
            var vertex: Vertex, normal: Vector3, uv: Vector2, position: Vector3,
                polygon: Polygon,
                polygons = new Array<Polygon>(),
                vertices;
			var matrix : Matrix, 
				meshPosition : Vector3,
				meshRotation : Vector3,
				meshRotationQuaternion: Quaternion,
				meshScaling: Vector3;
				
            if (mesh instanceof Mesh) {
                mesh.computeWorldMatrix(true);
                matrix = mesh.getWorldMatrix();
                meshPosition = mesh.position.clone();
                meshRotation = mesh.rotation.clone();
				if(mesh.rotationQuaternion) {
					meshRotationQuaternion = mesh.rotationQuaternion.clone();
				}
                meshScaling = mesh.scaling.clone();
            } else {
                throw 'BABYLON.CSG: Wrong Mesh type, must be BABYLON.Mesh';
            }

            var indices = mesh.getIndices(),
                positions = mesh.getVerticesData(VertexBuffer.PositionKind),
                normals = mesh.getVerticesData(VertexBuffer.NormalKind),
                uvs = mesh.getVerticesData(VertexBuffer.UVKind);

            var subMeshes = mesh.subMeshes;

            for (var sm = 0, sml = subMeshes.length; sm < sml; sm++) {
                for (var i = subMeshes[sm].indexStart, il = subMeshes[sm].indexCount + subMeshes[sm].indexStart; i < il; i += 3) {
                    vertices = [];
                    for (var j = 0; j < 3; j++) {
                        var sourceNormal = new Vector3(normals[indices[i + j] * 3], normals[indices[i + j] * 3 + 1], normals[indices[i + j] * 3 + 2]);
                        uv = new Vector2(uvs[indices[i + j] * 2], uvs[indices[i + j] * 2 + 1]);
                        var sourcePosition = new Vector3(positions[indices[i + j] * 3], positions[indices[i + j] * 3 + 1], positions[indices[i + j] * 3 + 2]);
                        position = Vector3.TransformCoordinates(sourcePosition, matrix);
                        normal = Vector3.TransformNormal(sourceNormal, matrix);

                        vertex = new Vertex(position, normal, uv);
                        vertices.push(vertex);
                    }

                    polygon = new Polygon(vertices, { subMeshId: sm, meshId: currentCSGMeshId, materialIndex: subMeshes[sm].materialIndex });

                    // To handle the case of degenerated triangle
                    // polygon.plane == null <=> the polygon does not represent 1 single plane <=> the triangle is degenerated
                    if (polygon.plane)
                        polygons.push(polygon);
                }
            }

            var csg = CSG.FromPolygons(polygons);
            csg.matrix = matrix;
            csg.position = meshPosition;
            csg.rotation = meshRotation;
            csg.scaling = meshScaling;
            csg.rotationQuaternion = meshRotationQuaternion;
            currentCSGMeshId++;

            return csg;
        }


        // Construct a BABYLON.CSG solid from a list of `BABYLON.CSG.Polygon` instances.
        private static FromPolygons(polygons: Polygon[]): CSG {
            var csg = new CSG();
            csg.polygons = polygons;
            return csg;
        }

        public clone(): CSG {
            var csg = new CSG();
            csg.polygons = this.polygons.map(p => p.clone());
            csg.copyTransformAttributes(this);
            return csg;
        }

        private toPolygons(): Polygon[] {
            return this.polygons;
        }

        public union(csg: CSG): CSG {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            return CSG.FromPolygons(a.allPolygons()).copyTransformAttributes(this);
        }

        public unionInPlace(csg: CSG): void {
            var a = new Node(this.polygons);
            var b = new Node(csg.polygons);

            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());

            this.polygons = a.allPolygons();
        }

        public subtract(csg: CSG): CSG {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();
            return CSG.FromPolygons(a.allPolygons()).copyTransformAttributes(this);
        }

        public subtractInPlace(csg: CSG): void {
            var a = new Node(this.polygons);
            var b = new Node(csg.polygons);

            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();

            this.polygons = a.allPolygons();
        }

        public intersect(csg: CSG): CSG {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();
            return CSG.FromPolygons(a.allPolygons()).copyTransformAttributes(this);
        }

        public intersectInPlace(csg: CSG): void {
            var a = new Node(this.polygons);
            var b = new Node(csg.polygons);

            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();

            this.polygons = a.allPolygons();
        }

        // Return a new BABYLON.CSG solid with solid and empty space switched. This solid is
        // not modified.
        public inverse(): CSG {
            var csg = this.clone();
            csg.inverseInPlace();
            return csg;
        }

        public inverseInPlace(): void {
            this.polygons.map(p => { p.flip(); });
        }

        // This is used to keep meshes transformations so they can be restored
        // when we build back a Babylon Mesh
        // NB : All CSG operations are performed in world coordinates
        public copyTransformAttributes(csg: CSG): CSG {
            this.matrix = csg.matrix;
            this.position = csg.position;
            this.rotation = csg.rotation;
            this.scaling = csg.scaling;
            this.rotationQuaternion = csg.rotationQuaternion;

            return this;
        }

        // Build Raw mesh from CSG
        // Coordinates here are in world space
        public buildMeshGeometry(name: string, scene: Scene, keepSubMeshes: boolean): Mesh {
            var matrix = this.matrix.clone();
            matrix.invert();

            var mesh = new Mesh(name, scene),
                vertices = [],
                indices = [],
                normals = [],
                uvs = [],
                vertex = Vector3.Zero(),
                normal = Vector3.Zero(),
                uv = Vector2.Zero(),
                polygons = this.polygons,
                polygonIndices = [0, 0, 0], polygon,
                vertice_dict = {},
                vertex_idx,
                currentIndex = 0,
                subMesh_dict = {},
                subMesh_obj;


            if (keepSubMeshes) {
                // Sort Polygons, since subMeshes are indices range
                polygons.sort((a, b) => {
                    if (a.shared.meshId === b.shared.meshId) {
                        return a.shared.subMeshId - b.shared.subMeshId;
                    } else {
                        return a.shared.meshId - b.shared.meshId;
                    }
                });
            }

            for (var i = 0, il = polygons.length; i < il; i++) {
                polygon = polygons[i];

                // Building SubMeshes
                if (!subMesh_dict[polygon.shared.meshId]) {
                    subMesh_dict[polygon.shared.meshId] = {};
                }
                if (!subMesh_dict[polygon.shared.meshId][polygon.shared.subMeshId]) {
                    subMesh_dict[polygon.shared.meshId][polygon.shared.subMeshId] = {
                        indexStart: +Infinity,
                        indexEnd: -Infinity,
                        materialIndex: polygon.shared.materialIndex
                    };
                }
                subMesh_obj = subMesh_dict[polygon.shared.meshId][polygon.shared.subMeshId];

                for (var j = 2, jl = polygon.vertices.length; j < jl; j++) {

                    polygonIndices[0] = 0;
                    polygonIndices[1] = j - 1;
                    polygonIndices[2] = j;

                    for (var k = 0; k < 3; k++) {
                        vertex.copyFrom(polygon.vertices[polygonIndices[k]].pos);
                        normal.copyFrom(polygon.vertices[polygonIndices[k]].normal);
                        uv.copyFrom(polygon.vertices[polygonIndices[k]].uv);
                        var localVertex = Vector3.TransformCoordinates(vertex, matrix);
                        var localNormal = Vector3.TransformNormal(normal, matrix);

                        vertex_idx = vertice_dict[localVertex.x + ',' + localVertex.y + ',' + localVertex.z];

                        // Check if 2 points can be merged
                        if (!(typeof vertex_idx !== 'undefined' &&
                            normals[vertex_idx * 3] === localNormal.x &&
                            normals[vertex_idx * 3 + 1] === localNormal.y &&
                            normals[vertex_idx * 3 + 2] === localNormal.z &&
                            uvs[vertex_idx * 2] === uv.x &&
                            uvs[vertex_idx * 2 + 1] === uv.y)) {
                            vertices.push(localVertex.x, localVertex.y, localVertex.z);
                            uvs.push(uv.x, uv.y);
                            normals.push(normal.x, normal.y, normal.z);
                            vertex_idx = vertice_dict[localVertex.x + ',' + localVertex.y + ',' + localVertex.z] = (vertices.length / 3) - 1;
                        }

                        indices.push(vertex_idx);

                        subMesh_obj.indexStart = Math.min(currentIndex, subMesh_obj.indexStart);
                        subMesh_obj.indexEnd = Math.max(currentIndex, subMesh_obj.indexEnd);
                        currentIndex++;
                    }

                }

            }

            mesh.setVerticesData(VertexBuffer.PositionKind, vertices);
            mesh.setVerticesData(VertexBuffer.NormalKind, normals);
            mesh.setVerticesData(VertexBuffer.UVKind, uvs);
            mesh.setIndices(indices);

            if (keepSubMeshes) {
                // We offset the materialIndex by the previous number of materials in the CSG mixed meshes
                var materialIndexOffset = 0,
                    materialMaxIndex;

                mesh.subMeshes = new Array<SubMesh>();

                for (var m in subMesh_dict) {
                    materialMaxIndex = -1;
                    for (var sm in subMesh_dict[m]) {
                        subMesh_obj = subMesh_dict[m][sm];
                        SubMesh.CreateFromIndices(subMesh_obj.materialIndex + materialIndexOffset, subMesh_obj.indexStart, subMesh_obj.indexEnd - subMesh_obj.indexStart + 1, mesh);
                        materialMaxIndex = Math.max(subMesh_obj.materialIndex, materialMaxIndex);
                    }
                    materialIndexOffset += ++materialMaxIndex;
                }
            }

            return mesh;
        }

        // Build Mesh from CSG taking material and transforms into account
        public toMesh(name: string, material: Material, scene: Scene, keepSubMeshes: boolean): Mesh {
            var mesh = this.buildMeshGeometry(name, scene, keepSubMeshes);

            mesh.material = material;

            mesh.position.copyFrom(this.position);
            mesh.rotation.copyFrom(this.rotation);
			if(this.rotationQuaternion) {
				mesh.rotationQuaternion = this.rotationQuaternion.clone();
			}
            mesh.scaling.copyFrom(this.scaling);
            mesh.computeWorldMatrix(true);

            return mesh;
        }
    }
} 