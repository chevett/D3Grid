var $ = require('jquery'),
	d3 = require('d3'),
	_ = require('lodash'),
	createTable = require('./table'),
	createPager = require('./pager');

var DEFAULTS = {
	tableSelector: '.lgtm-table',
	pagerSelector: '.lgtm-pager',
	fetchRows: function(){console.dir('implement grid.fetchRows');},
};

function Grid(opt) {
	if (!(this instanceof Grid)) return new Grid(opt);

	opt = _.extend({},  DEFAULTS, opt);

	d3.select($el[0]).classed("d3g-container loading-content-container", true);

	var $el = $('<div><table class="lgtm-table"></table><div class="lgtm-pager"></div></div>'),
		self = this,
		table = createTable(opt, $el),
		pager = createPager(opt, $el),
		pageCache;

	function _getPageAndSortParameters() {
		var pageAndSortParams = _.extend({}, table.getSortParameters(), pager.getPageParameters());

		if (typeof opt.customParams === 'function') {
			pageAndSortParams = opt.customParams(pageAndSortParams);
		}

		return pageAndSortParams;
	}

	function _startDataLoad(pageAndSortParameters) {
		pageAndSortParameters = pageAndSortParameters || _getPageAndSortParameters();

		var pageIndex = pageAndSortParameters.PageIndex,
			pageSize = pageAndSortParameters.PageSize;

		opt.fetchRows(pageIndex, pageSize, function(err, data, totalRows){
			if (err){
				console.error(err);
				return window.alert('grid error');
			}

			opt.rows = data;
			opt.totalRowCount = totalRows;
			pageCache[pageIndex] = data;

			table.render(data);
			pager.render(data);
		});
	}

	table.on('sort', function () {
		pageCache = {};
		pager.reset();
		_startDataLoad();
	});

	function changePage() {
		var pageAndSortParameters = _getPageAndSortParameters();

		if (pageCache[pageAndSortParameters.PageIndex]) {
			var gridData = pageCache[pageAndSortParameters.PageIndex];

			table.render(gridData);
			pager.render(gridData);
		} else {
			_startDataLoad(pageAndSortParameters);
		}
	}

	pager.on('page', changePage);
	pager.on('page-size', function () {
		pageCache = {};
		pager.reset();
		_startDataLoad();
	});

	self.element = $el[0];
	self.update = self.render = function(){
		pageCache = {};
		pager.reset();
		_startDataLoad();
	};
}

module.exports = Grid;

