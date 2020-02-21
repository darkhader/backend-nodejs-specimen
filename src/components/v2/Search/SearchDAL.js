import * as elasticSearchUtil from '../../../util/elasticSearchUtil';

export const searchAll = async (key) => {
  return Promise.all([
    searchPost({ limit: 10, offset: 0, filters: {} }, key),
    searchUser({ limit: 3, offset: 0 }, key),
  ]);
};

export const searchPost = async ({ limit, offset, filters: { categoryId, fromTime, toTime } }, key) => {
  const filter = [
    {
      term: {
        active: true,
      },
    },
  ];
  if (!isNaN(categoryId)) {
    filter.push({ terms: { categoryIds: [categoryId] } });
  }
  if (fromTime && !isNaN(fromTime)) {
    if (toTime && !isNaN(toTime)) {
      filter.push({ range: { createdTime: { gte: fromTime, lte: toTime } } });
    } else {
      filter.push({ range: { createdTime: { gte: fromTime } } });
    }
  } else if (toTime && !isNaN(toTime)) {
    filter.push({ range: { createdTime: { lte: toTime } } });
  }

  const body = {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: key,
              fields: ['content', 'title'],
            },
          },
        ],
        filter,
      },
    },
    highlight: {
      fields: {
        content: {
          fragment_size: 100,
          number_of_fragments: 1,
        },
        title: {
          fragment_size: 100,
          number_of_fragments: 1,
        },
      },
    },
  };
  const { hits: { total: { value: count }, hits } } = await elasticSearchUtil.search({
    index: 'ainews_posts',
    body,
    from: offset,
    size: limit,
    sort: [
      '_score:desc',
      'createdTime:desc',
    ],
    _source: false,
  });
  const ids = hits.map(hit => hit._id);
  const highlightObj = hits.map(hit => {
    const result = { id: hit._id, highlight: {} };
    if (hit.highlight.content) {
      const [content] = hit.highlight.content;
      result.highlight.content = content;
    }
    if (hit.highlight.title) {
      const [title] = hit.highlight.title;
      result.highlight.title = title;
    }
    return result;
  })
    .reduce((result, { id, highlight }) => ({ ...result, [id]: highlight }), {});
  return [ids, count, highlightObj];
};

export const searchUser = async ({ limit, offset }, key) => {
  const body = {
    query: {
      bool: {
        must: [
          {
            match: { fullName: { query: key } },
          },
        ],
        filter: { term: { active: true } },
      },
    },
  };
  const { hits: { total: { value: count }, hits } } = await elasticSearchUtil.search({
    index: 'ainews_users',
    body,
    from: offset,
    size: limit,
    sort: [
      '_score:desc',
      'numberFollower:desc',
    ],
    _source: false,
  });
  return [hits.map(hit => hit._id), count];
};

export const suggestKeyWord = async (key) => {
  const body = {
    suggest: {
      searchKey: {
        prefix: key,
        completion: {
          field: 'keyword',
          size: 10,
        },
      },
    },
  };
  const { suggest } = await elasticSearchUtil.search({
    index: 'ainews_searchkey',
    body,
  });
  return suggest ? suggest.searchKey[0].options.map(data => data._source.keyword.input) : [];
};

// lib
export const updateSearchKey = key => {
  const bodyUpdate = {
    script: {
      source: 'ctx._source.keyword.weight += 1',
      lang: 'painless',
    },
    upsert: {
      keyword: {
        input: key,
        weight: 1,
      },
    },
  };
  elasticSearchUtil.update({
    index: 'ainews_searchkey',
    id: Buffer.from(key).toString('base64'),
    body: bodyUpdate,
  }).catch(() => { });
};
