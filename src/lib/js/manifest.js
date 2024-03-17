/* Manifest =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */

/* Manifest Base Classes /* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */

/** Manifest Class **/
class Manifest {
	constructor(options) {
		this.options = options;
		// Default options (passed from main.js)
		// options = { serviceurl: 'https://manifest.supplystudies.com/services/', hoverHighlight: false, retinaTiles: false };

		this.initialized = false;
		this.changelog = 'no notes';
		
		this.supplychains = [];
		this.Supplychain = new ManifestSupplyChain();
		this.Interface = new ManifestUI(); this.options.mobile = this.Interface.IsMobile();
		this.Atlas = new ManifestAtlas(options);
		this.Visualization = new ManifestVisualization();		
		this.Messenger = new ManifestMessenger(this.Atlas);
		this.Util = new ManifestUtilities();
	}

	/** SupplyChain processor main wrapper function. **/
	Process(type, d, options) {
		for (let s in MI.supplychains) { if (MI.supplychains[s].details.id === options.id) { return; }}
		options = Object.assign(options, MI.options);
		
		switch(type) {
			case 'manifest': d = this.Supplychain.Map(this.Supplychain.Setup(this.FormatMANIFEST(d, options))); 
				this.ManifestGraph({supplychain: {stops:d.stops, hops:d.hops}}, Object.assign(options, {style: d.details.style})); break;
			case 'smap': this.Supplychain.Map(this.Supplychain.Setup(this.FormatSMAP(d.g, options))); 
				this.SMAPGraph(d.r, Object.assign(options, {style: d.g.details.style})); break;
			case 'yeti': this.Supplychain.Map(this.Supplychain.Setup(this.FormatYETI(d, options))); break;
			case 'gsheet': d = this.Supplychain.Map(this.Supplychain.Setup(this.FormatGSHEET(d, options))); 
				this.ManifestGraph({supplychain: {stops:d.stops, hops:d.hops}}, Object.assign(options, {style: d.details.style})); break;
		}		
		this.Visualization.Set(MI.Visualization.type);	
		if (options.start) { MI.Atlas.SetView(MI.options.view);}	
	}

	/** Format a Manifest file so Manifest can understand it */
	FormatMANIFEST(manifest, options) {	
		let d = {type: 'FeatureCollection', mtype: 'manifest', raw: manifest, mapper: {}, options: options, details: {id: options.id, url: '#manifest-'+options.url, layers: [], measures: []}, properties: {title: manifest.summary.name, description: MI.Util.markdowner.makeHtml(manifest.summary.description)}, features: [], stops: [], hops: []};
		if (d.details.url === '#manifest-') { d.details.url = '#'; }
		for (let n of manifest.nodes) {
			let ft = {type: 'Feature', properties: {index: n.overview.index, scid: options.id, title: n.overview.name, description: MI.Util.markdowner.makeHtml(n.overview.description), placename: n.location.address, category: n.attributes.category ? n.attributes.category : '', images: n.attributes.image.map(function(s) { return s.URL;}).join(','), icon: n.attributes.icon ? n.attributes.icon : '', color: n.attributes.color ? n.attributes.color : '', measures: n.measures.measures, sources: n.attributes.sources.map(function(s) { return s.URL;}).join(','), notes: MI.Util.markdowner.makeHtml(n.notes.markdown)}, geometry: {type:'Point', coordinates:[n.location.geocode.split(',')[1] ? n.location.geocode.split(',')[1] : '', n.location.geocode.split(',')[0] ? n.location.geocode.split(',')[0] : '']}};
			//for (let attr in manifest.nodes[i].attributes) { d.features[i][attr] = manifest.nodes[i].attributes[attr]; }
			d.stops.push({ local_stop_id:Number(n.overview.index), id:Number(n.overview.index), attributes:ft.properties, geometry:ft.geometry });
			if (n.attributes.destinationindex !== '') {
				//dev
				let hops = n.attributes.destinationindex.split(',');
			}
			d.features.push(ft);
		}
		for (let h of d.hops) {
			h.from = d.features[h.from_stop_id-1]; h.to = d.features[h.to_stop_id-1];
			//dev
			let ft = {type: 'Feature', properties: {title: h.from.properties.title+'|'+h.to.properties.title, category: [...new Set([... h.from.properties.category.split(','),...h.to.properties.category.split(',')])].join(','), connections: {from: {scid: h.from.properties.scid, index: h.from.properties.index}, to: {scid:h.to.properties.scid, index:h.to.properties.index}}}, geometry: {type:"Line", coordinates:[h.from.geometry.coordinates,h.to.geometry.coordinates]}};
			d.features.push(ft);
		}	
		return d;
	}

	/** Format a legacy Sourcemap file so Manifest can understand it */
	FormatSMAP(d, options) {
		d.raw = JSON.parse(JSON.stringify(d)); d.mtype = 'smap';
		d.details = options; d.details.layers = []; d.details.measures = {}; d.mapper = {}; 
		d.details.url = '#smap-'+options.idref;
		return d;
	}

	/** Format a google sheet file so Manifest can understand it */
	// dev
	FormatMANIFEST(manifest, options) {
		let d = {
			type: 'FeatureCollection',
			mtype: 'manifest',
			raw: manifest,
			mapper: {},
			options: options,
			details: {
				id: options.id,
				url: '#manifest-' + options.url,
				layers: [],
				measures: []
			},
			properties: {
				title: manifest.summary.name,
				description: this.Util.markdowner.makeHtml(manifest.summary.description)
			},
			features: [],
		};

		let nodeIndexMap = {};

		manifest.nodes.forEach((node) => {
			let nodeFeature = {
				type: 'Feature',
				properties: {
					index: node.overview.index,
					scid: options.id,
					title: node.overview.name,
					description: this.Util.markdowner.makeHtml(node.overview.description),
					placename: node.location.address,
					category: node.attributes.category || '',
					images: node.attributes.image.map(s => s.URL).join(','),
					icon: node.attributes.icon || '',
					color: node.attributes.color || '',
					measures: node.measures.measures,
					sources: node.attributes.sources.map(s => s.URL).join(','),
					notes: this.Util.markdowner.makeHtml(node.notes.markdown),
				},
				geometry: {
					type: 'Point',
					coordinates: [
						parseFloat(node.location.geocode.split(',')[1]),
						parseFloat(node.location.geocode.split(',')[0])
					]
				}
			};

			d.features.push(nodeFeature);
			nodeIndexMap[node.overview.index] = nodeFeature;
		});

		manifest.nodes.forEach(node => {
			let sourceNodeFeature = nodeIndexMap[node.overview.index];

			if (Array.isArray(node.attributes.destinationindex)) {
				node.attributes.destinationindex.forEach(destination => {
					if (typeof destination === 'object' && destination.index !== undefined) {
						let targetNodeFeature = nodeIndexMap[destination.index];
						if (sourceNodeFeature && targetNodeFeature) {
							let hopFeature = {
								type: 'Feature',
								properties: {
									title: `${sourceNodeFeature.properties.title} to ${targetNodeFeature.properties.title}`,
									from_stop_id: node.overview.index,
									to_stop_id: destination.index,
									distance: destination.distance || 'Unknown',
									transportation: destination.transportation || 'Unknown',
									extraInfo: destination.extraInfo || 'None', // Handling arbitrary value
								},
								geometry: {
									type: "LineString",
									coordinates: [sourceNodeFeature.geometry.coordinates, targetNodeFeature.geometry.coordinates]
								}
							};
							d.features.push(hopFeature);
						}
					}
				});
			} else if (typeof node.attributes.destinationindex === 'string') {
				let destinations = node.attributes.destinationindex.split(',');
				destinations.forEach(destinationIndex => {
					let index = parseInt(destinationIndex.trim(), 10);
					let targetNodeFeature = nodeIndexMap[index];
					if (!isNaN(index) && targetNodeFeature) {
						let hopFeature = {
							type: 'Feature',
							properties: {
								title: `${sourceNodeFeature.properties.title} to ${targetNodeFeature.properties.title}`,
								from_stop_id: node.overview.index,
								to_stop_id: index,
								distance: 'Unknown',
								transportation: 'Unknown',
								extraInfo: 'None', // Default value for arbitrary information
							},
							geometry: {
								type: "LineString",
								coordinates: [sourceNodeFeature.geometry.coordinates, targetNodeFeature.geometry.coordinates]
							}
						};
						d.features.push(hopFeature);
					}
				});
			}
		});

		return d;
	}



	GSheetToJson(sheet) {
		let rows = [];
		for (let i = 1; i < sheet.values.length; i++) {
			let row = {};
			for (let [j, prop] of sheet.values[0].entries()) {
				row[prop.toLowerCase()] = sheet.values[i][j];
				if (typeof row[prop.toLowerCase()] === 'undefined') { row[prop.toLowerCase()] = '';}
			}
			rows[rows.length] = row;
		}
		return rows;
	}
	
	/** Format a Yeti file so Manifest can understand it */
	FormatYETI(yeti, options) {	
		let d = {type:'FeatureCollection', mtype: 'yeti'};
		d.raw = yeti;
		d.details = options; d.details.layers = []; d.details.measures = {};
		d.properties = {title: yeti.company_name, description: yeti.company_address};
		for (let item in yeti){	d.properties[item] = yeti[item]; }	
		d.tempFeatures = d.properties.vendor_table; delete d.properties.vendor_table;	
				
		// Format Layer
		d.features = [];
	
		for (let i in d.tempFeatures) {
			if (typeof d.tempFeatures[i] !== 'undefined') {
				d.features[i] = {type: 'Feature'};			
				d.features[i].properties = {};	
				for (let ft in d.tempFeatures[i]) { d.features[i][ft] = d.tempFeatures[i][ft]; }
				d.features[i].properties.title = d.tempFeatures[i].vendor_name; delete d.tempFeatures[i].vendor_name;
				d.features[i].properties.description = d.tempFeatures[i].product_descriptions.join(' / '); delete d.tempFeatures[i].product_descriptions;
				d.features[i].properties.placename = d.tempFeatures[i].vendor_address; delete d.tempFeatures[i].vendor_address;
						
				d.features[i].properties.measures = {};
				d.features[i].properties.percent = d.tempFeatures[i].shipments_percents_company;
				d.features[i].properties.measures.percent = d.tempFeatures[i].shipments_percents_company;
				d.details.measures.percent = {max:100, min:0};
				d.features[i].geometry = {type:'Point', coordinates:[d.tempFeatures[i].lng, d.tempFeatures[i].lat]};
			}
		}
	
		delete d.tempFeatures;
		return d;
	}

	/** Setup the graph relationships for Manifest files **/
	ManifestGraph(d, options) {
		let sc = null;
		for (let s in MI.supplychains) {
			if (MI.supplychains[s].details.id === options.id) { 
				MI.supplychains[s].graph = {nodes:[], links:[]}; 
				sc = MI.supplychains[s]; 
			} 
		}

		if (typeof d.supplychain.stops !== 'undefined') {
			for (let i = 0; i < d.supplychain.stops.length; ++i) {
			
				let title = (d.supplychain.stops[i].attributes.title) ? d.supplychain.stops[i].attributes.title : 'Node';
				let place = (d.supplychain.stops[i].attributes.placename) ? d.supplychain.stops[i].attributes.placename : 
							((d.supplychain.stops[i].attributes.address) ? d.supplychain.stops[i].attributes.address : '');
				let loc = place.split(', ').pop();
				let localstopid = Number(d.supplychain.stops[i].local_stop_id-1);
				let newNode = { id: options.id+'-'+localstopid, name: title, loc: loc, place: place, group: options.id, links: [], ref: sc.mapper[localstopid],
					color: options.style.color, fillColor: options.style.fillColor };
				sc.graph.nodes[d.supplychain.stops[i].local_stop_id - 1] = newNode;
			}
		}
		
		if (typeof d.supplychain.hops !== 'undefined' && d.supplychain.hops.length > 0) {
			sc.graph.type = 'directed';
			for (let j = 0; j < d.supplychain.hops.length; ++j) {	
				sc.graph.nodes[d.supplychain.hops[j].to_stop_id - 1].links.push(sc.graph.nodes[d.supplychain.hops[j].from_stop_id - 1].loc);
				let newLink = { source: Number(d.supplychain.hops[j].from_stop_id - 1), target: Number(d.supplychain.hops[j].to_stop_id - 1),
					 color: options.style.color, fillColor: options.style.fillColor};
				sc.graph.links.push(newLink);

			} 	
			for (let k = 0; k < d.supplychain.hops.length; ++k) {
				sc.graph.nodes[d.supplychain.hops[k].from_stop_id - 1].links.push(sc.graph.nodes[d.supplychain.hops[k].to_stop_id - 1].loc);
			}
		} else { sc.graph.type = 'undirected'; }

		for (let l = 0; l < sc.graph.links.length; l++) {
			sc.graph.links[l].source = String(options.id)+'-'+(sc.graph.links[l].source);
			sc.graph.links[l].target = String(options.id)+'-'+(sc.graph.links[l].target);		
		}
		for (let l = 0; l < sc.graph.nodes.length; l++) {
			if (typeof sc.graph.nodes[l] !== 'undefined') {
				let id = sc.graph.nodes[l].id.split('-');
				sc.graph.nodes[l].id = id[0]+'-'+(Number(id[1]));				
			}
		}		
	}
	
	SMAPGraph(d, options) {
		let sc = null;
		for (let s in MI.supplychains) {
			if (MI.supplychains[s].details.id === options.id) { 
				MI.supplychains[s].graph = {nodes:[], links:[]}; 
				sc = MI.supplychains[s]; 
			} 
		}

		let digits = null;
		if (typeof d.supplychain.stops !== 'undefined') {
			//d.supplychain.stops = d.supplychain.stops.reverse();
			for (let i = 0; i < d.supplychain.stops.length; ++i) {
			
				let title = (d.supplychain.stops[i].attributes.title) ? d.supplychain.stops[i].attributes.title : 'Node';
				let place = (d.supplychain.stops[i].attributes.placename) ? d.supplychain.stops[i].attributes.placename : 
							((d.supplychain.stops[i].attributes.address) ? d.supplychain.stops[i].attributes.address : '');
				let loc = place.split(', ').pop();

				// Correct local stop id
				digits = (Math.round(100*Math.log(d.supplychain.stops.length)/Math.log(10))/100)+1;
				d.supplychain.stops[i].local_stop_id = Number((''+d.supplychain.stops[i].local_stop_id).slice(-1*digits));

				let ref = sc.mapper['map'+place.replace(/[^a-zA-Z0-9]/g, '')+title.replace(/[^a-zA-Z0-9]/g, '')];
				let newNode = { id: options.id+'-'+Number(d.supplychain.stops[i].local_stop_id-1), name: title, loc: loc, place: place, group: options.id, links: [], ref: ref,
					color: options.style.color, fillColor: options.style.fillColor };
				sc.graph.nodes[d.supplychain.stops[i].local_stop_id - 1] = newNode;
			}
		} delete sc.mapper; // Remove Mapper
	
		if (typeof d.supplychain.hops !== 'undefined' && d.supplychain.hops.length > 0) {
			sc.graph.type = 'directed';
			for (let j = 0; j < d.supplychain.hops.length; ++j) {
				// Correct stop ids
				d.supplychain.hops[j].to_stop_id = Number((''+d.supplychain.hops[j].to_stop_id).slice(-1*digits));
				d.supplychain.hops[j].from_stop_id = Number((''+d.supplychain.hops[j].from_stop_id).slice(-1*digits));
			
				sc.graph.nodes[d.supplychain.hops[j].to_stop_id - 1].links.push(sc.graph.nodes[d.supplychain.hops[j].from_stop_id - 1].loc);
				let newLink = { source: Number(d.supplychain.hops[j].from_stop_id - 1), target: Number(d.supplychain.hops[j].to_stop_id - 1),
					 color: options.style.color, fillColor: options.style.fillColor};
				sc.graph.links.push(newLink);

			} 	
			for (let k = 0; k < d.supplychain.hops.length; ++k) {
				sc.graph.nodes[d.supplychain.hops[k].from_stop_id - 1].links.push(sc.graph.nodes[d.supplychain.hops[k].to_stop_id - 1].loc);
			}
		} else { sc.graph.type = 'undirected'; }

		let offset = 0;
		for (let l = 0; l < sc.graph.nodes.length; l++) { if (typeof sc.graph.nodes[l] === 'undefined') { offset++; } }
		for (let l = 0; l < sc.graph.links.length; l++) {
			sc.graph.links[l].source = String(options.id)+'-'+(sc.graph.links[l].source - offset);
			sc.graph.links[l].target = String(options.id)+'-'+(sc.graph.links[l].target - offset);		
		}
		for (let l = 0; l < sc.graph.nodes.length; l++) {
			if (typeof sc.graph.nodes[l] !== 'undefined') {
				let id = sc.graph.nodes[l].id.split('-');
				sc.graph.nodes[l].id = id[0]+'-'+(Number(id[1])-offset);				
			}
		}		
		let adjgraph = [];
		for (let l = 0; l < sc.graph.nodes.length; l++) { if (typeof sc.graph.nodes[l] !== 'undefined') { adjgraph.push(sc.graph.nodes[l]); } }
		sc.graph.nodes = adjgraph.reverse();		
	}

	/** Setup the graph relationships for Yeti files **/
	YETIGraph(d, options) {
		let sc = null;
		for (let i in MI.supplychains) {
			if (MI.supplychains[i].details.id === options.id) { 
				MI.supplychains[i].graph = {nodes:[], links:[]}; 
				sc = MI.supplychains[i]; 
			} 
		}
		let root = { id: sc.details.id, group: 1, name: sc.properties.company_name, ref: sc.features[0] };
		sc.graph.nodes.push(root);
	
		for (let f in sc.features) {
			let node = { id: sc.features[f].properties.lid, group: sc.features[f].properties.lid, name: sc.features[f].properties.title, ref: sc.features[f] };
			sc.graph.nodes.push(node);
		}
		for (let j = 1; j <  sc.graph.nodes.length; ++j) {
			let link = { size: 4, source: 0, target: j, value: 10 };
			sc.graph.links.push(link);
		}	
		sc.graph.type = 'directed';
	}

	LoadManifestFile(filedata, filename) {
		for (let s in MI.supplychains) { if (MI.supplychains[s].details.id === filename.hashCode()) { return false; }}
		
	    if (!filedata) { return false; }

	    let reader = new FileReader();
		reader.filename = filename;
	    reader.onload = function(e) { MI.Process('manifest', JSON.parse(e.target.result), {id: e.target.filename.hashCode(), url: '', start:MI.supplychains.length === 0}); };
	    reader.readAsText(filedata);
		document.getElementById('file-input').value = "";
		return true;
	}
	
	ExportManifest(d, filename, format) {
		let a = document.createElement('a');
	
		if (format === 'map') {
			try {
				MI.Interface.ShowLoader();
				leafletImage(MI.Atlas.map, function(err, canvas) {			
					let link = document.createElement('a');
					link.download = filename+'.png';
					canvas.toBlob(function(blob){ link.href = URL.createObjectURL(blob); link.click(); },'image/png');
					MI.Interface.ClearLoader();
				});
			} catch(e) { }
			  		
		} else if (format === 'json') {
			let json = '';
			if (d.mtype === 'smap') { json = this._smapToManifest(d); } 
			else if (d.mtype === 'gsheet') { json = this._gsheetToManifest(d); }
			else { json = d.raw; }
			a.setAttribute('href', 'data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(json)));
			a.setAttribute('download', filename+'.json');
			a.click();
		} else if (format === 'markdown') {
			a.setAttribute('href', 'data:text/md;charset=utf-8,'+encodeURIComponent(d));
			a.setAttribute('download', filename+'.md');
			a.click();
		}
	}

	_gsheetToManifest(d) {
		let s = {summary:{name:d.properties.title, description:d.properties.description}, nodes:[]};
		let off = 0;
		for (let node of d.graph.nodes) {
			if (off === 0) { off = Number(node.id.split('-')[1]); } if (off >= Number(node.id.split('-')[1])) { off = Number(node.id.split('-')[1]); }
			let n = {overview:{index:Number(node.id.split('-')[1])+1,name:node.ref.properties.title,description:node.ref.properties.description},
				location:{address:node.ref.properties.placename,geocode:node.ref.geometry.coordinates.reverse().join(',')},
				attributes:{destinationindex:[],image:[{URL:''}],sources:[{URL:''}]}, measures:{measures:[]},notes:{markdown:'',keyvals:[{key:'',value:''}]}};
			for (let m of node.ref.properties.measures) { if (Number(m.mvalue) !== 0) { n.measures.measures.push(m); } }						
			s.nodes[Number(node.id.split('-')[1])] = n;
		}

		for (let link of d.graph.links) { 

			s.nodes[Number(link.source.split('-')[1])].attributes.destinationindex.push(Number(link.target.split('-')[1])+1); 
		}
		for (let i = 0; i < s.nodes.length; i++) {
			if (typeof s.nodes[i] === 'undefined') {
				s.nodes.splice(i, 1); 
				
				for (let j = 0; j < s.nodes.length; j++) { if (j >= i && typeof s.nodes[j] !== 'undefined') {
					s.nodes[j].overview.index = Number(s.nodes[j].overview.index) - 1;			
				}}
				for (let k = 0; k < s.nodes.length; k++) { if (typeof s.nodes[k] !== 'undefined') {
					for (let d in s.nodes[k].attributes.destinationindex) {
						if (s.nodes[k].attributes.destinationindex[d] > i) {
							s.nodes[k].attributes.destinationindex[d] = Number(s.nodes[k].attributes.destinationindex[d]) - 1;
						}
					}					
				}}		
				
				i--;
			} 
		}
		for (let node of s.nodes) {  if (typeof node !== 'undefined') {
			if (node.attributes.destinationindex.length === 0) { node.attributes.destinationindex = '';} 
			else { node.attributes.destinationindex = node.attributes.destinationindex.filter((d, index, dests) => { return dests.indexOf(d) === index; }).join(','); }
		}}
		
		return s;
	}
	
	_smapToManifest(d) {
		let s = {summary:{name:d.properties.title, description:d.properties.description}, nodes:[]};
		let off = 0;
		for (let node of d.graph.nodes) {
			if (off === 0) { off = Number(node.id.split('-')[1]); } if (off >= Number(node.id.split('-')[1])) { off = Number(node.id.split('-')[1]); }
			let n = {overview:{index:Number(node.id.split('-')[1])+1,name:node.ref.properties.title,description:node.ref.properties.description},
				location:{address:node.ref.properties.placename,geocode:node.ref.geometry.coordinates.reverse().join(',')},
				attributes:{destinationindex:[],image:[{URL:''}],sources:[{URL:''}]}, measures:{measures:[]},notes:{markdown:'',keyvals:[{key:'',value:''}]}};
			for (let m of node.ref.properties.measures) { if (Number(m.mvalue) !== 0) { n.measures.measures.push(m); } }						
			s.nodes[Number(node.id.split('-')[1])] = n;
		}
		if (off > 0) {
			let newlist = [], destmap = d => Number(d) - off;
			for (let node of s.nodes) { if (typeof node !== 'undefined') {
				let index = Number(node.overview.index) - off;
				node.overview.index = index;
				
				newlist[index -1] = node;
			}}
			s.nodes = newlist;
		}
		for (let link of d.graph.links) { 

			s.nodes[Number(link.source.split('-')[1])].attributes.destinationindex.push(Number(link.target.split('-')[1])+1); 
		}
		for (let i = 0; i < s.nodes.length; i++) {
			if (typeof s.nodes[i] === 'undefined') {
				s.nodes.splice(i, 1); 
				
				for (let j = 0; j < s.nodes.length; j++) { if (j >= i && typeof s.nodes[j] !== 'undefined') {
					s.nodes[j].overview.index = Number(s.nodes[j].overview.index) - 1;			
				}}
				for (let k = 0; k < s.nodes.length; k++) { if (typeof s.nodes[k] !== 'undefined') {
					for (let d in s.nodes[k].attributes.destinationindex) {
						if (s.nodes[k].attributes.destinationindex[d] > i) {
							s.nodes[k].attributes.destinationindex[d] = Number(s.nodes[k].attributes.destinationindex[d]) - 1;
						}
					}					
				}}		
				
				i--;
			} 
		}
		for (let node of s.nodes) {  if (typeof node !== 'undefined') {
			if (node.attributes.destinationindex.length === 0) { node.attributes.destinationindex = '';} 
			else { node.attributes.destinationindex = node.attributes.destinationindex.filter((d, index, dests) => { return dests.indexOf(d) === index; }).join(','); }
		}}
		
		return s;
	}
}

class ManifestMessenger {
	constructor(atlas) {
		this.interval = null;
		this.objects = [];
		
		atlas.livelayer = new L.layerGroup();
		atlas.map.addLayer(atlas.livelayer);		
	}


	Add(url, callback) {
		fetch(url).then(c => c.json()).then(d => callback(d)).then(obj => {this.objects.push(obj); console.log(this.objects);}); 
	}
	
	AddObject(oid) {
		let call = 'https://manifest.supplystudies.com/services/?type=aprsfi&id='+oid;
		this.Add(call, function(d) {
			let vessel = {name: d.entries[0].name, heading: d.entries[0].heading, latlng: new L.latLng(d.entries[0].lat,d.entries[0].lng)};
			vessel.style = MI.Atlas.styles.live; vessel.style.rotation = vessel.angle = vessel.heading;
			let tooltipContent = `<div id="tooltip-oid-${oid}" class="mtooltip" style="background: #ffffff; color: #FF0080;">The vessel ${vessel.name}</div>`;
			vessel.service = call;
			vessel.mapref = MI.Atlas.livelayer.addLayer(new L.triangleMarker(vessel.latlng, vessel.style).bindTooltip(tooltipContent));
			return vessel;
		});
	}
	
	Update() {
		
	}
	UpdateList() {
		
	}
}

/* Manifest Utility Class */
class ManifestUtilities {
	constructor() {
		this.markdowner = new showdown.Converter();	
		
		let customClassExt = {
		    type: 'output',
		    filter: function (text) {
		        return text
		            .replace(/<p>\[\.([a-z0-9A-Z\s]+)\]<\/p>[\n]?<(.+)>/g, `<$2 class="$1">`)
		            .replace(/<(.+)>\[\.([a-z0-9A-Z\s]+)\]/g, `<$1 class="$2">`)            
					.replace(/class="(.+)"/g, function (str) { if (str.indexOf("<em>") !== -1) { return str.replace(/<[/]?em>/g, '_'); } return str; });
		    }
		};
		this.markdowner.addExtension(customClassExt);
	}
	static Linkify(str) { return str.replaceAll(ManifestUtilities.URLMatch(), '<a href=\"$1\">$1</a>').replaceAll(ManifestUtilities.ManifestMatch(), '<a class="manifest-link" href="$1">$1</a>'); }
	static URLMatch() { return /(?![^<]*>|[^<>]*<\/(?!(?:p|pre|li|span)>))(https?:\/\/[^\s"]+)/gi; }
	static ManifestMatch() { return /(?![^<]*>|[^<>]*<\/(?!(?:p|pre|li|span)>))(manifest?:\/\/[^\s"]+)/gi; }
	static RemToPixels(rem) { return rem * parseFloat(getComputedStyle(document.documentElement).fontSize); }
}

/* Utility functions */
String.prototype.hashCode = function() {
  let hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) { chr = this.charCodeAt(i); hash = ((hash << 5) - hash) + chr; hash |= 0; }
  return Math.abs(hash);
};
