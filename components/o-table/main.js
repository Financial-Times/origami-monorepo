import oTable from './src/js/oTable.js';

const constructAll = function() {
	oTable.init();
	window.alert("table activated");
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};

document.addEventListener('o.DOMContentLoaded', constructAll);



export default oTable;
