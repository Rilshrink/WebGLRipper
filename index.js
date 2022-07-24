;(function() {
  function script() {
	const OBJUtils = {
		DrawModes: {
			"POINTS":         0,
			"LINES":          1,
			"LINE_STRIP":     2,
			"LINE_LOOP":      3,
			"TRIANGLES":      4,
			"TRIANGLE_STRIP": 5,
			"TRIANGE_FAN":    6
		},

		/* Used to store a texture for use in OBJModel */
		OBJTexture: class {
			constructor(filename, url) {
				this._URL = url;
				this._FILENAME = filename;
			}

			getTexString() {
				return `map_Kd ${this._FILENAME}.png`;
			}
		},

		OBJColor: class {
			r = 0;
			g = 0;
			b = 0;
			constructor(r, g, b, a) {
				this.r = r;
				this.g = g;
				this.b = b;
			}

			toString() {
				return `${this.r} ${this.g} ${this.b}`;
			}
		},

		/* Used to store color info about the primitive */
		OBJColTexture: class {
			constructor(filename, color) {
				this._COLOR = color;
				this._FILENAME = filename;
			}

			getTexString() {
				return `Kd ${this._COLOR.toString()}`;
			}
		},

		/* Used to store indicies and how to draw them */
		OBJPrimitive: class  {
			constructor(mode, indicies) {
				this._MODE = mode;
				this._INDICIES = indicies;
			}
		},

		/* OBJ Creation */
		OBJModel: class {
			// Primitives = [] // Array of OBJPrimitive's
			// Verticies = [] // Array of Verticies
			// Normals = [] // Array of Normals
			// UVs = [] // Array of UVs
			// Textures = [] // Array of OBJTexture or OBJColTexture for the obj
			constructor(_Primitives, _Verticies, _Normals, _UVs, _Textures, _Name) {
				this.vertex = _Verticies;
				this.normal = _Normals;
				this.uv = _UVs;
				this.primitives = _Primitives;
				this.textures = _Textures;
				this.name = _Name || `rip${Math.random()}`;
			}

			BuildOBJ() {
				let obj = '';
				obj += `mtllib ${this.name}.mtl\n`; // Set model library to use
				obj += `o ${this.name}\n`; 			// Define model name

				for(let vI = 0; vI < this.vertex.length; vI += 3) {
					obj += 'v ';
					for(let vJ = 0; vJ < 3; ++vJ)
						obj += this.vertex[vI + vJ] + ' ';
					obj += '\n';
				} // Write all vertex positions into the obj file

				for(let nI = 0; nI < this.normal.length; nI += 3) {
					obj += 'vn ';
					for(let nJ = 0; nJ < 3; ++nJ)
						obj += this.normal[nI + nJ] + ' ';
					obj += '\n';
				} // Write all normal positions into the obj file

				for(let uI = 0; uI < this.uv.length; uI += 2) {
					obj += 'vt ';
					for(let uJ = 0; uJ < 2; ++uJ)
						obj += this.uv[uI + uJ] + ' ';
					obj += '\n';
				} // Write all Texture Coords into the obj file

				obj += `usemtl ${this.name}\n`; // Specify to start using the mtl lib for the indicies below
				obj += 's on \n';                // Enable Smooth Shading

				let hasNormals = this.normal.length != 0;
				let hasUVs = this.uv.length != 0;

				let primitive = this.primitives;
				switch(primitive._MODE) {
					case OBJUtils.DrawModes["TRIANGLES"]:
					case OBJUtils.DrawModes["TRIANGLE_STRIP"]:
						let isStrip = (primitive._MODE == OBJUtils.DrawModes["TRIANGLE_STRIP"]);
						for(let j = 0; j + 2 < primitive._INDICIES.length; !isStrip ? j += 3 : j++) {
							obj += 'f ';
							let order = [ 0, 1, 2 ];
							if(isStrip && (j % 2 == 1)) {
								order = [ 0, 2, 1 ];
							}
							for(let k = 0; k < 3; ++k) {
								let faceNumber = primitive._INDICIES[j + order[k]] + 1;
								obj += faceNumber;
								if(hasNormals || hasUVs) {
									obj += '/';
									if(hasUVs)
										obj += faceNumber;
									if(hasNormals)
										obj += `/${faceNumber}`;
								}
								obj += ' ';
							}
							obj += '\n';
						}
						break;
				} // Write indicies into obj file
				return obj;
			}

			BuildMTL() {
				let mtl = '';
				mtl += `newmtl ${this.name}\n`;
				this.textures.forEach(function(texture) {
					mtl += `${texture.getTexString()}\n`;
				});
				return mtl;
			}

			DownloadModel() {
				Downloader.DownloadString(`${this.name}.obj`, this.BuildOBJ());
				this.textures.forEach(async function(texture) {
					if(!texture._URL)
						return;
					await Downloader.DownloadImage(texture._FILENAME, texture._URL);
				});
				if(this.textures.length > 0) {
					Downloader.DownloadString(`${this.name}.mtl`, this.BuildMTL());
				}
			}
		}
	} // OBJ File Namespace

	let Global_ImageCache = [];

	class Downloader {
		static async DownloadImage(filename, url) {
			if(Global_ImageCache[filename] == 420)
				return;
			const a = document.createElement("a");
			a.href = await this.toDataURL(url);
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			Global_ImageCache[filename] = 420;
		}

		static DownloadString(filename, str) {
			var textblob = new Blob([str], {type:'text/plain'});
			var link = document.createElement('a');
			link.download = filename;
			link.innerHTML = 'Download File';
			link.href = window.URL.createObjectURL(textblob);
			link.onclick = function(e) { document.body.removeChild(e.target); };
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
		}
		static toDataURL(url) {
			return fetch(url).then((response) => {
				return response.blob();
			}).then(blob => {
				return URL.createObjectURL(blob);
			});
		}
	} // Downloader Class

	let _window = parent.window;

	// Create config object
	_window.WEBGLRipperSettings = {
		CaptureSceneKeyCode: 45, // Insert Key
		CaptureFolder: "/WebGLRipperRips", // Folder to save all of your captures into
		isCapturingScene: false, // Boolean if the scene is to be captured next frame
		isDebug: true, // Boolean if debug
		hasOverlay: false, // Checks if the window already has a created overlay
	};

	let LogToParent = function() {
		if(!_window.WEBGLRipperSettings.isDebug) 
			return;
		_window.console.log('[WebGLRipper] ', ...arguments);
	};

	document.addEventListener('keydown', function(event) {
		if(event.keyCode == _window.WEBGLRipperSettings.CaptureSceneKeyCode) {
			_window.WEBGLRipperSettings.isCapturingScene = true;
			LogToParent("Capturing scene!");
		}
	});

	_window.RIPPERS = [];
	_window.MODELS = [];

	class WebGLRipperInterceptor {
		_IsEnabled = true;
		_GLViewport = { x: 0, y: 0, width: 0, height: 0 };
		_GLContext = null;
		_GLState = new Map();
		_GLBuffers = new Map();
		_GLActiveTextureIndex = 0;
		_GLCurrentBoundTexture = null;
		_GLTextures = new Map();

		_GLCurrentUVS = [];
		_GLCurrentUVIndex = -1;
		_GLCurrentNormals = [];
		_GLCurrentNormalIndex = -1;
		_GLCurrentVerticies = [];
		_GLCurrentVertexIndex = -1;

		_GLCurrentAttribIndex = 0;
		_GLCurrentAttrib = [];
		_GLCurrentAttribEnabled = [];
		_CurrentModels = [];
		_TextureCache = new Map();
		_isCapturing = false;
		_needsToReset = false;

		constructor(gl) { 
			this._GLContext = gl;
			this._GLState = new Map();
		}

		_AttribTypeEnum = {
			VERTEX: 0,
			NORMAL: 1,
			UVS: 2
		};

		GetDataURIFromWebGLTexture(gl, webglTexture, texWidth, texHeight, flip = true) {
			let fb = gl.createFramebuffer();

			// make this the current frame buffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

			// attach the texture to the framebuffer.
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D, webglTexture, 0);

			// check if you can read from this type of texture.
			let canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);

			// Unbind the framebuffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			if (!canRead)
				return null;
			
			// bind the framebuffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
				
			var pixels = new Uint8Array(texWidth * texHeight * 4);
			// read the pixels
			gl.readPixels(0, 0, texWidth, texHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		 
			// Unbind the framebuffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			if(flip) {
				// Now do pixel manipulation to make it right side up -- https://stackoverflow.com/questions/41969562/how-can-i-flip-the-result-of-webglrenderingcontext-readpixels
				var halfHeight = texHeight / 2 | 0;  // the | 0 keeps the result an int
				var bytesPerRow = texWidth * 4;

				// make a temp buffer to hold one row
				var temp = new Uint8Array(texWidth * 4);
				for (var y = 0; y < halfHeight; ++y) {
					var topOffset = y * bytesPerRow;
					var bottomOffset = (texHeight - y - 1) * bytesPerRow;

					// make copy of a row on the top half
					temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

					// copy a row from the bottom half to the top
					pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

					// copy the copy of the top half row to the bottom half 
					pixels.set(temp, bottomOffset);
				}
			}

			let canvas = document.createElement("canvas");
			canvas.width = texWidth;
			canvas.height = texHeight;

			let ctx = canvas.getContext('2d');

			let arr = new Uint8ClampedArray(pixels);
			
			let imgData = new ImageData(arr, texWidth, texHeight);
			ctx.putImageData(imgData, 0, 0);
			return canvas.toDataURL();
		}

		GetAttribValueType(attrib) {
			let vertexNames = [	'position',
								'vertex', 
								'avertexposition', 
								's_attribute_0',
								'avertex',
								'vertex_position' // Playcanvas.js
							  ];
			let normalNames = [
								'avertexnormal', 
								'normal', 
								's_attribute_1',
								'vertex_normal'   // Playcanvas.js
							  ];

			let uvNames =     [
								'uv',
								'texcoord',
								'texcoords',
								'texcoord0',
								'atexturecoord',
								'vertex_texCoord0' // Playcanvas.js
			                  ];
			let attribName = attrib.name.toLowerCase();
			if(vertexNames.includes(attribName)) 
				return this._AttribTypeEnum.VERTEX;
			if(normalNames.includes(attribName))
				return this._AttribTypeEnum.NORMAL;
			if(uvNames.includes(attribName))
				return this._AttribTypeEnum.UVS;
			return -1;
		}
		
		isPossibleTextureUniform(uniformName) {
			let textureNames = [
				'map',
				'uSampler',
				'Texture0',
				'texture',
				'boneSampler',
				'boneTexture',
				'source' // Playcanvas.js
			];
			LogToParent("Found possible map_kD: ", uniformName);
			return textureNames.includes(uniformName);
		}

		HelperFunc_GetCurrentProgram(self, gl) {
			return gl.getParameter(gl.CURRENT_PROGRAM);
		}

		HelperFunc_GetAllTextures(self, gl) {
			let textures = [];
			let uniformData = self.readUniformData(gl);
			LogToParent("Current Uniform Data: ", uniformData);

			let _CurrentProgram = self.HelperFunc_GetCurrentProgram(self, gl);

			uniformData.forEach(uniform => {
				if(uniform.type != gl.SAMPLER_2D)
					return;
				if(!self.isPossibleTextureUniform(uniform.name))
					return;

				var loc = gl.getUniformLocation(_CurrentProgram, uniform.name);
				let samplerLocation = gl.getUniform(_CurrentProgram, loc);

				if(samplerLocation < 0 || samplerLocation > 31) {
					LogToParent("Sampler location out of bounds: ", samplerLocation);
					return;
				}
				let tex = self._GLTextures.get(samplerLocation);
				if(tex == undefined || !tex)  {
					LogToParent("No Texture found in slot: ", samplerLocation);
					return;
				}

				if(self._TextureCache.get(tex)) {
					textures.push(self._TextureCache.get(tex));
					LogToParent("Texture already in cache");
					return;
				}

				let texWidth = tex.width || 2048;
				let texHeight = tex.height || 2048;
				let uri = self.GetDataURIFromWebGLTexture(gl, tex, texWidth, texHeight);
				if(uri == null) {
					LogToParent("Recieved null texture!");
					return;
				}

				let objTexture = new OBJUtils.OBJTexture("Texkd_RIP" + self._CurrentModels.length, uri);
				self._TextureCache.set(tex, objTexture);
				textures.push(objTexture);
				LogToParent("Recieved texture, Sampler Location: ", samplerLocation, ", WebGL Texture Object: ", tex);
			});
			return textures;
		}

		HelperFunc_UpdateAllAttributes(self, gl) { // Got help from: https://github.com/benvanik/WebGL-Inspector/blob/c5f961dba261cbd94d9b3ff3ddbaf8b7d3bf5ef9/core/ui/shared/BufferPreview.js#L191
			let attribData = self.readAttribData(gl);

			attribData.forEach(function(attr) {

				if(!self._GLCurrentAttribEnabled[attr.loc])
					return;

				let _bufferData = self.getBufferDataFromBuffer(self, gl.getVertexAttrib(attr.loc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING));
				if(!_bufferData)
					return;

				let attribType = self.GetAttribValueType(attr);
				let bufferData = [];

				let vAttribData = self._GLCurrentAttrib[attr.loc];
				LogToParent("Got vAttribData: ", vAttribData, "Along with attr: ", attr);

				let byteAdvance = 0;
				switch(vAttribData.type) {
					case gl.BYTE:
					case gl.UNSIGNED_BYTE:
						byteAdvance = 1 * vAttribData.size;
						break;
					case gl.SHORT:
					case gl.UNSIGNED_SHORT:
						byteAdvance = 2 * vAttribData.size;
						break;
					default:
					case gl.FLOAT:
						byteAdvance = 4 * vAttribData.size;
						break;
				}

				let fStride = vAttribData.stride ? vAttribData.stride : byteAdvance;

				switch(vAttribData.type) {
					case gl.BYTE:
						_bufferData = new Int8Array(_bufferData, 0);
						break;
					case gl.UNSIGNED_BYTE:
						_bufferData = new Uint8Array(_bufferData, 0);
						break;
					case gl.SHORT:
						_bufferData = new Int16Array(_bufferData, 0);
						break;
					case gl.UNSIGNED_SHORT:
						_bufferData = new Uint16Array(_bufferData, 0);
						break;
					default:
					case gl.FLOAT:
						_bufferData = new Float32Array(_bufferData, 0);
						break;
				}

				LogToParent("Final Stride is: ", fStride, ", Buffer byte length: ", _bufferData.byteLength, "Original Buffer Data: ", _bufferData);

				var byteOffset = 0;
				while(byteOffset < _bufferData.byteLength) {
					var readView = null;
					switch (vAttribData.type) {
						case gl.BYTE:
							readView = new Int8Array(_bufferData.buffer.slice(byteOffset));
							break;
						case gl.UNSIGNED_BYTE:
							readView = new Uint8Array(_bufferData.buffer.slice(byteOffset));
							break;
						case gl.SHORT:
							readView = new Int16Array(_bufferData.buffer.slice(byteOffset));
							break;
						case gl.UNSIGNED_SHORT:
							readView = new Uint16Array(_bufferData.buffer.slice(byteOffset));
							break;
						default:
						case gl.FLOAT:
							readView = new Float32Array(_bufferData.buffer.slice(byteOffset));
							break;
					}

					for(let i = 0; i < vAttribData.size; i++) {
						bufferData.push(readView[i]);
					}

					byteOffset += fStride;
				}

				if(!bufferData) {
					LogToParent("Couldn't get bufferData: ", attr);
					return;
				}

				switch(vAttribData.type) {
					case gl.BYTE:
						bufferData = new Int8Array(bufferData, 0);
						break;
					case gl.UNSIGNED_BYTE:
						bufferData = new Uint8Array(bufferData, 0);
						break;
					case gl.SHORT:
						bufferData = new Int16Array(bufferData, 0);
						break;
					case gl.UNSIGNED_SHORT:
						bufferData = new Uint16Array(bufferData, 0);
						break;
					default:
					case gl.FLOAT:
						bufferData = new Float32Array(bufferData, 0);
						break;
				}

				LogToParent("Got Attribute Data: ", attr, bufferData);

				switch(attribType) {
					case 0:
						self._GLCurrentVerticies = bufferData;
						self._GLCurrentVertexIndex = attr.loc;
						break;
					case 1:
						self._GLCurrentNormals = bufferData;
						self._GLCurrentNormalIndex = attr.loc;
						break;
					case 2:
						self._GLCurrentUVS = bufferData;
						self._GLCurrentUVIndex = attr.loc;
						break;
					default:
						LogToParent("Unknown Attrib Type: ", attr);
						break;
				}
			});
		}

		HelperFunc_ResetAll(self, gl) {
			Global_ImageCache = [];
			self._TextureCache = new Map();
		}

		hooked_viewport(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
			let _x      = args[0];
			let _y      = args[1];
			let _width  = args[2];
			let _height = args[3];
			self._GLViewport = { x: _x, y: _y, width: _width, height: _height };
		}

		hooked_activeTexture(self, gl, args, oFunc) {
			self._GLActiveTextureIndex = args[0] - gl.TEXTURE0;
		}

		hooked_texImage2D(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
			let target = args[0];
			if(target != gl.TEXTURE_2D)
				return;
			//LogToParent("Got a TEXTURE_2D texImage2D call: ", args);
			let pixels = null;
			switch(args.length) {
				case 9:
					pixels = args[8];
					break;
				case 6:
					pixels = args[5];
					break;
			}
			if(pixels == null)
				return;
			let _ArrayBufferView = (new Uint16Array()).constructor.prototype.__proto__.constructor;
			if((pixels instanceof _ArrayBufferView))
				return;
			if(pixels instanceof ImageData || pixels instanceof HTMLImageElement || pixels instanceof HTMLCanvasElement || pixels instanceof HTMLVideoElement || pixels instanceof ImageBitmap) {
				self._GLCurrentBoundTexture.width = pixels.width;
				self._GLCurrentBoundTexture.height = pixels.height;
				//LogToParent("Got tex width and height: ", pixels.width, ", ", pixels.height);
			}
		}

		hooked_shaderSource(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
			let shader = args[0];
			let source = args[1];
			if(!shader || !source)
				return;
			LogToParent("Got Shader: ", shader, source);
		}

		hooked_bindTexture(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
			let target = args[0];
			let texture = args[1];
			if(target != gl.TEXTURE_2D)
				return;
			if(texture == null)
				return;
			self._GLTextures.set(self._GLActiveTextureIndex, texture);
			self._GLCurrentBoundTexture = texture;
		}

		hooked_drawArrays(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
			if(!self._isCapturing)
				return;

			LogToParent("Captured 'drawArrays' call: ", args);

			let drawMode = args[0];
			let indFirst = args[1];
			let indCount = args[2];

			if(drawMode != OBJUtils.DrawModes.TRIANGLES && drawMode != OBJUtils.DrawModes.TRIANGLE_STRIP) {
				LogToParent("Unsupported draw mode: ", drawMode);
				return;
			}

			self.HelperFunc_UpdateAllAttributes(self, gl);

			let textures = self.HelperFunc_GetAllTextures(self, gl);

			if(!self._GLCurrentVerticies)
				return;

			let indicies = [];

			// Go through each position, see if it exists or not and add an indicie to it!
			let indice = 0;
			for(let i = 0; i < self._GLCurrentVerticies.length; i += 3) {
				indicies.push(indice++);
			}
				
			LogToParent("Using Indicies, size: ", indicies.length, ", to cut out from ", indFirst, " to ", indFirst, " + ", indCount);
			indicies = indicies.slice(indFirst, indFirst + indCount);
			LogToParent("New indicies size: ", indicies.length);

			let objPrimitives = new OBJUtils.OBJPrimitive(drawMode, indicies);
			let objID = self._CurrentModels.length;
			let builtOBJ = new OBJUtils.OBJModel(objPrimitives, self._GLCurrentVerticies, self._GLCurrentNormals, self._GLCurrentUVS, textures, `RIP${objID}`);
			self._CurrentModels.push(builtOBJ);
			LogToParent("Finished Building OBJ: ", builtOBJ);
		}

		hooked_drawElements(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
			if(!self._isCapturing)
				return;
			LogToParent("Captured 'drawElements' call: ", args);

			let drawMode  = args[0];
			let indCount  = args[1];
			let indType   = args[2];
			let indOffset = args[3];

			if(drawMode != OBJUtils.DrawModes.TRIANGLES && drawMode != OBJUtils.DrawModes.TRIANGLE_STRIP) {
				LogToParent("Unsupported draw mode: ", drawMode);
				return;
			}

			let oIndicies = self.getBufferedIndicies(self);
			if(!oIndicies || oIndicies == undefined) {
				LogToParent("No Indicies found in 'drawElements' call");
				return;
			}

			self.HelperFunc_UpdateAllAttributes(self, gl);

			let _indOffset = indOffset / 2;

			if(oIndicies instanceof ArrayBuffer)
				oIndicies = new Uint8Array(oIndicies);

			LogToParent("Using Indicies, size: ", oIndicies.length, ", to cut out from ", _indOffset, " to ", _indOffset, " + ", indCount);
			let indicies = new Uint16Array(indCount);
			for(let ind = 0; ind < indCount; ind++)
				indicies[ind] = oIndicies[_indOffset + ind];
			LogToParent("New indicies size: ", indicies.length);

			let textures = self.HelperFunc_GetAllTextures(self, gl);
			
			let objPrimitives = new OBJUtils.OBJPrimitive(drawMode, indicies);
			let objID = self._CurrentModels.length;
			let builtOBJ = new OBJUtils.OBJModel(objPrimitives, self._GLCurrentVerticies, self._GLCurrentNormals, self._GLCurrentUVS, textures, `RIP${objID}`);
			self._CurrentModels.push(builtOBJ);
			LogToParent("Finished Building OBJ: ", builtOBJ);
		}

		hooked_drawRangeElements(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements
			if(!self._isCapturing)
				return;

			let drawMode = args[0];
			let start    = args[1];
			let end      = args[2];
			let count    = args[3];
			let type     = args[4];
			let offset   = args[5];
			
			LogToParent("Captured unsupported 'hooked_drawRangeElements' call: ", args);
		}

		hooked_drawBuffers(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawBuffers
			if(!self._isCapturing)
				return;

			let buffers = args[0];
			
			LogToParent("Captured unsupported 'drawBuffers' call: ", args);
		}

		hooked_drawElementsInstanced(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
			if(!self._isCapturing)
				return;
			
			let drawMode = args[0];
			let count = args[1];
			let type = args[2];
			let offset = args[3];
			let instanceCount = args[4];

			LogToParent("Captured unsupported 'drawElementsInstanced' call: ", args);
		}

		hooked_createBuffer(self, gl, args) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createBuffer

		}

		hooked_bindBuffer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
			let target = args[0];
			let buffer = args[1];
			self._GLState.set(target, buffer);
		}

		hooked_bufferData(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
			let target = args[0];
			let data = null;
			switch(args.length) {
				case 2:
					data = null; 
					break;
				default:
					let maybeData = args[1];
					let _ArrayBufferView = (new Uint16Array()).constructor.prototype.__proto__.constructor; // https://stackoverflow.com/questions/64650119/react-error-sharedarraybuffer-is-not-defined-in-firefox
					if(maybeData instanceof ArrayBuffer || (crossOriginIsolated && maybeData instanceof SharedArrayBuffer) || maybeData instanceof _ArrayBufferView) {
						data = maybeData;
					}
					break;
			}
			
			let buffer = self._GLState.get(target);
			if(buffer && data) {
				self._GLBuffers.set(buffer, data);
				return;
			}
			LogToParent("Called buffer data without specifying data: ", args);
		}

		hooked_clear(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
			if(self._CurrentModels.length > 0 && self._isCapturing) {
				LogToParent(`Downloading ${self._CurrentModels.length}`);
				self._isCapturing = false;
				let models = self._CurrentModels.slice();
				let sleep = function(delay) {
					var start = new Date().getTime();
					while (new Date().getTime() < start + delay);
				};
				models.forEach(function(obj) {
					Downloader.DownloadString(`${obj.name}.obj`, obj.BuildOBJ());
					sleep(250);
					obj.textures.forEach(async function(texture) {
						if(!texture._URL)
							return;
						await Downloader.DownloadImage(texture._FILENAME, texture._URL);
						sleep(250);
					});
					sleep(250);
					if(obj.textures.length > 0) {
						Downloader.DownloadString(`${obj.name}.mtl`, obj.BuildMTL());
					}
					sleep(150);
				});
				self._needsToReset = true;
				self._CurrentModels = [];
			}

			if(_window.WEBGLRipperSettings.isCapturingScene && self._IsEnabled) { // Fix Race conditions
				self._isCapturing = true;
				_window.WEBGLRipperSettings.isCapturingScene = false;
			}

			if(self._needsToReset) {
				self.HelperFunc_ResetAll(self, gl);
				self._needsToReset = false;
			}

			self._GLCurrentUVS = [];
			self._GLCurrentNormals = [];
			self._GLCurrentVerticies = [];
		}

		hooked_enableVertexAttribArray(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
			if(!self._isCapturing)
				return;
			let index = args[0];

			self._GLCurrentAttribEnabled[index] = true;
		}

		hooked_disableVertexAttribArray(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
			if(!self._isCapturing)
				return;
			let index = args[0];

			self._GLCurrentAttribEnabled[index] = false;
		}

		hooked_vertexAttribIPointer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer
			let index = args[0];
			let size = args[1];
			let type = args[2];
			let stride = args[3];
			let offset = args[4];
			self._GLCurrentAttrib[index] = { size: size, type: type, stride: stride, offset: offset, normalized: false };
			self._GLCurrentAttribEnabled[index] = true;
			//LogToParent("Captured vertexAttribIPointer, ", args);
		}

		hooked_vertexAttribPointer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
			let index = args[0];
			let size = args[1];
			let type = args[2];
			let normalized = args[3];
			let stride = args[4];
			let offset = args[5];
			self._GLCurrentAttrib[index] = { size: size, type: type, stride: stride, offset: offset, normalized: normalized };
			self._GLCurrentAttribEnabled[index] = true;
			//LogToParent("Captured vertexAttribPointer, ", args);
		}

		readUniformData(gl, p) {
			let uniformData = [];
			let program = gl.getParameter(gl.CURRENT_PROGRAM);
			if(program) {
				let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
				for(let j = 0; j < uniformCount; j++) {
					let info = gl.getActiveUniform(program, j);
					if(info) {
						uniformData.push({
							index: j,
							name: info.name,
							size: info.size,
							type: info.type
						});
					}
				}
			}
			return uniformData;
		}

		readAttribData(gl, p) {
			let attribData = [];
			let program = gl.getParameter(gl.CURRENT_PROGRAM);
			if(program) {
				let attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
				for(let j = 0; j < attribCount; j++) {
					let info = gl.getActiveAttrib(program, j);
					if(info) {
						let loc = gl.getAttribLocation(program, info.name);
						attribData.push({
							index: j,
							loc: loc,
							name: info.name,
							size: info.size,
							type: info.type
						});
					}
				}
			}
			return attribData;
		}

		getBufferedIndicies(self) {
			let index = self._GLContext.getParameter(self._GLContext.ELEMENT_ARRAY_BUFFER_BINDING);
			return index == null ? null : self.getBufferDataFromBuffer(self, index);
		}

		getCurrentVertexArrayBuffer(self) { // Doesn't ever seem to be used
			let index = self._GLContext.getParameter(self._GLContext.VERTEX_ARRAY_BINDING);
			return index == null ? null : self.getBufferDataFromBuffer(self, index);
		}

		getCurrentArrayBuffer(self) {
			let index = self._GLContext.getParameter(self._GLContext.ARRAY_BUFFER_BINDING);
			return index == null ? null : self.getBufferDataFromBuffer(self, index);
		}

		getBufferDataFromBuffer(self, buffer) {
			return self._GLBuffers.get(buffer);
		}

	}

	let hideHook = function(fn, oFn) { fn.toString = oFn.toString.bind(oFn); } // Just in case the site checks for function modifications through a string check.

	function RegisterGLFunction(_GL, _RipperInterceptor, _Method) {
		if(_GL[_Method] == undefined) return;
		let hookFunc = _RipperInterceptor[`hooked_${_Method}`];
		if(!hookFunc) {
			_RipperInterceptor[`hooked_${_Method}`] = function(self, gl, args) {
				// To prevent errors create a 'fake' method
				LogToParent(`${_Method}: `, args);
			};
			hookFunc = _RipperInterceptor[`hooked_${_Method}`];
			if(!hookFunc) // If it's still null then idk what to do
				return;
		}
		let originalFunc = _GL[_Method];
		_GL[_Method] = function() {
			if(hookFunc(_RipperInterceptor, this, arguments, originalFunc))
				return;
			return originalFunc.apply(this, arguments);
		};
		hideHook(_GL[_Method], originalFunc);
	}

	/* Hook into context getter */
	LogToParent("Attempting to hook into canvas");
	let oFunc = window.HTMLCanvasElement.prototype.getContext;
	window.HTMLCanvasElement.prototype.getContext = function() {
		let contextNames = ["webgl", "webgl2", "experimental-webgl"];
		let isRequestingWebGL = contextNames.indexOf(arguments[0].toLowerCase()) != -1;

		if(!isRequestingWebGL) {
			LogToParent("Got unsupported context: ", arguments[0]);
			return oFunc.apply(this, arguments);
		}

		let gl = oFunc.apply(this, arguments);
		
		if(!gl)
			return gl;

		if(!gl._hooked) {
			let glRipper = new WebGLRipperInterceptor(gl);
			RegisterGLFunction(gl, glRipper, "clear");
			RegisterGLFunction(gl, glRipper, "bindBuffer");
			RegisterGLFunction(gl, glRipper, "bufferData");
			RegisterGLFunction(gl, glRipper, "createBuffer");
			RegisterGLFunction(gl, glRipper, "drawArrays");
			RegisterGLFunction(gl, glRipper, "drawElements");
			RegisterGLFunction(gl, glRipper, "drawElementsInstanced");
			RegisterGLFunction(gl, glRipper, "drawBuffers");
			//RegisterGLFunction(gl, glRipper, "useProgram");
			RegisterGLFunction(gl, glRipper, "vertexAttribPointer");
			RegisterGLFunction(gl, glRipper, "vertexAttribIPointer");
			RegisterGLFunction(gl, glRipper, "enableVertexAttribArray");
			RegisterGLFunction(gl, glRipper, "disableVertexAttribArray");
			RegisterGLFunction(gl, glRipper, "shaderSource");
			RegisterGLFunction(gl, glRipper, "activeTexture");
			RegisterGLFunction(gl, glRipper, "bindTexture");
			RegisterGLFunction(gl, glRipper, "texImage2D");
			_window.RIPPERS.push(glRipper);
			LogToParent(`Injected into '${arguments[0]}' context!`);
		}

		return gl;
	}; /* Got from 'WebGL-Inspector' https://github.com/benvanik/WebGL-Inspector/blob/master/core/extensions/chrome/contentscript.js#L178 */

	hideHook(window.HTMLCanvasElement.prototype.getContext, oFunc);
  }

  /* Used to get the 'window' */
  function inject(fn) {
    const script = document.createElement('script');
    script.text = `(${fn.toString()})();`;
    document.documentElement.appendChild(script);
  }
  
  /* Inject our script into the page */
  inject(script);
})();
