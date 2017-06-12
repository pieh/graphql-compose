/* @flow */
/* eslint-disable no-new, no-unused-vars */

import {
  graphql,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLList,
} from 'graphql';
import GQC from '../__mocks__/gqc';
import Resolver from '../resolver';
import TypeComposer from '../typeComposer';
import InputTypeComposer from '../inputTypeComposer';

describe('Resolver', () => {
  let resolver;

  beforeEach(() => {
    resolver = new Resolver({ name: 'find' });
  });

  it('should throw error if not passed name in opts', () => {
    expect(() => {
      new Resolver({});
    }).toThrowError();
  });

  it('should have getDescription/setDescription methods', () => {
    resolver.setDescription('Find users');
    expect(resolver.getDescription()).toBe('Find users');
  });

  it('should have getKind/setKind methods', () => {
    resolver.setKind('query');
    expect(resolver.getKind()).toBe('query');

    expect(() => {
      resolver.setKind('unproperKind');
    }).toThrowError('You provide incorrect value');
  });

  describe('`type` methods', () => {
    it('should have setType/getType methods', () => {
      resolver.setType(GraphQLString);
      expect(resolver.getType()).toBe(GraphQLString);

      expect(() => {
        resolver.setType(
          new GraphQLInputObjectType({
            name: 'MyInput',
            fields: () => ({}),
          })
        );
      }).toThrowError();
    });

    it('should convert type as string to GraphQLType', () => {
      const myResolver = new Resolver({
        name: 'myResolver',
        type: 'String!',
      });
      expect(myResolver.type).toBeInstanceOf(GraphQLNonNull);
      expect(myResolver.type.ofType).toBe(GraphQLString);
    });

    it('should convert type definition to GraphQLType', () => {
      const myResolver = new Resolver({
        name: 'myResolver',
        type: `
          type SomeType {
            name: String
          }
        `,
      });
      expect(myResolver.type).toBeInstanceOf(GraphQLObjectType);
      expect(myResolver.type.name).toBe('SomeType');
    });

    it('should accept TypeComposer for `type` option', () => {
      const typeTC = TypeComposer.create('type SomeType22 { test: String }');
      const myResolver = new Resolver({
        name: 'myResolver',
        type: typeTC,
      });
      expect(myResolver.type).toBeInstanceOf(GraphQLObjectType);
      expect(myResolver.type.name).toBe('SomeType22');
    });

    it('should throw error on InputTypeComposer for `type` option', () => {
      const someInputITC = InputTypeComposer.create('input SomeInputType { add: String }');
      expect(() => {
        new Resolver({
          name: 'myResolver',
          type: someInputITC,
        });
      }).toThrowError('InputTypeComposer');
    });

    it('should accept Resolver for `type` option', () => {
      const someOtherResolver = new Resolver({
        name: 'someOtherResolver',
        type: `
          type SomeType {
            name: String
          }
        `,
      });

      const myResolver = new Resolver({
        name: 'myResolver',
        type: someOtherResolver,
      });
      expect(myResolver.type).toBeInstanceOf(GraphQLObjectType);
      expect(myResolver.type.name).toBe('SomeType');
    });

    it('should accept array for `type` option', () => {
      const myResolver = new Resolver({
        name: 'myResolver',
        type: ['String'],
      });
      expect(myResolver.type).toBeInstanceOf(GraphQLList);
      expect(myResolver.type.ofType).toBe(GraphQLString);
    });

    it('should have wrapType() method', () => {
      const newResolver = resolver.wrapType(prevType => {
        // eslint-disable-line
        return 'String';
      });

      expect(newResolver.getType()).toBe(GraphQLString);
    });
  });

  describe('`args` methods', () => {
    it('should have setArg and getArg methods', () => {
      resolver.setArg('a1', { type: GraphQLString });
      expect(resolver.getArg('a1').type).toBe(GraphQLString);

      resolver.setArg('a2', { type: 'String' });
      expect(resolver.getArg('a2').type).toBe(GraphQLString);

      resolver.setArg('a3', 'String');
      expect(resolver.getArg('a3').type).toBe(GraphQLString);
    });

    it('should have setArgs method', () => {
      resolver.setArgs({
        b1: { type: GraphQLString },
        b2: { type: 'String' },
        b3: 'String',
      });
      expect(resolver.getArg('b1').type).toBe(GraphQLString);
      expect(resolver.getArg('b2').type).toBe(GraphQLString);
      expect(resolver.getArg('b3').type).toBe(GraphQLString);
    });

    it('should have getArgType method', () => {
      resolver.setArgs({
        b1: 'String',
      });
      expect(resolver.getArgType('b1')).toBe(GraphQLString);
      expect(resolver.getArgType('unexisted')).toBeUndefined();
    });

    it('should return undefined for non-existing arg', () => {
      expect(resolver.getArg('unexisted')).toBeUndefined();
    });

    it('should remove args', () => {
      const argName = 'argField';
      const argConfig = { type: GraphQLString };
      resolver.setArg(argName, argConfig);
      resolver.removeArg(argName);
      expect(resolver.getArg(argName)).toBeUndefined();

      resolver.setArg('a1', 'String');
      resolver.setArg('a2', 'String');
      resolver.setArg('a3', 'String');
      resolver.removeArg(['a1', 'a2']);
      expect(resolver.getArg('a1')).toBeUndefined();
      expect(resolver.getArg('a2')).toBeUndefined();
      expect(resolver.getArg('a3')).toBeTruthy();
    });

    it('should remove other args', () => {
      resolver.setArg('a1', 'String');
      resolver.setArg('a2', 'String');
      resolver.removeOtherArgs('a1');
      expect(resolver.getArg('a1')).toBeTruthy();
      expect(resolver.getArg('a2')).toBeUndefined();

      resolver.setArg('a1', 'String');
      resolver.setArg('a2', 'String');
      resolver.setArg('a3', 'String');
      resolver.removeOtherArgs(['a1', 'a2']);
      expect(resolver.getArg('a1')).toBeTruthy();
      expect(resolver.getArg('a2')).toBeTruthy();
      expect(resolver.getArg('a3')).toBeUndefined();
    });

    it('should add args', () => {
      resolver.setArgs({
        b1: 'String',
      });
      resolver.addArgs({
        b2: 'String',
        b3: 'String',
      });
      expect(resolver.hasArg('b1')).toBe(true);
      expect(resolver.hasArg('b2')).toBe(true);
      expect(resolver.hasArg('b3')).toBe(true);
    });

    it('should have wrapArgs() method', () => {
      const newResolver = resolver.wrapArgs(prevArgs => {
        return { ...prevArgs, arg1: 'String' };
      });

      expect(newResolver.getArg('arg1').type).toBe(GraphQLString);
    });

    it('should make args required', () => {
      resolver.setArgs({
        b1: { type: GraphQLString },
        b2: { type: 'String' },
        b3: 'String',
        b4: 'String',
      });
      resolver.makeRequired('b1');
      resolver.makeRequired(['b2', 'b3']);
      expect(resolver.isRequired('b1')).toBe(true);
      expect(resolver.getArgType('b1')).toBeInstanceOf(GraphQLNonNull);
      expect(resolver.isRequired('b2')).toBe(true);
      expect(resolver.isRequired('b3')).toBe(true);
      expect(resolver.isRequired('b4')).toBe(false);
    });

    it('should make args optional', () => {
      resolver.setArgs({
        b1: { type: new GraphQLNonNull(GraphQLString) },
        b2: { type: 'String!' },
        b3: 'String!',
        b4: 'String!',
      });
      resolver.makeOptional('b1');
      resolver.makeOptional(['b2', 'b3']);
      expect(resolver.isRequired('b1')).toBe(false);
      expect(resolver.getArgType('b1')).toBe(GraphQLString);
      expect(resolver.isRequired('b2')).toBe(false);
      expect(resolver.isRequired('b3')).toBe(false);
      expect(resolver.isRequired('b4')).toBe(true);
    });

    describe('reorderArgs()', () => {
      it('should change args order', () => {
        resolver.setArgs({ a1: 'Int', a2: 'Int', a3: 'Int' });
        expect(resolver.getArgNames().join(',')).toBe('a1,a2,a3');
        resolver.reorderArgs(['a3', 'a2', 'a1']);
        expect(resolver.getArgNames().join(',')).toBe('a3,a2,a1');
      });

      it('should append not listed args', () => {
        resolver.setArgs({ a1: 'Int', a2: 'Int', a3: 'Int' });
        expect(resolver.getArgNames().join(',')).toBe('a1,a2,a3');
        resolver.reorderArgs(['a3']);
        expect(resolver.getArgNames().join(',')).toBe('a3,a1,a2');
      });

      it('should skip non existed args', () => {
        resolver.setArgs({ a1: 'Int', a2: 'Int', a3: 'Int' });
        expect(resolver.getArgNames().join(',')).toBe('a1,a2,a3');
        resolver.reorderArgs(['a22', 'a3', 'a55', 'a1', 'a2']);
        expect(resolver.getArgNames().join(',')).toBe('a3,a1,a2');
      });
    });

    describe('cloneArg()', () => {
      beforeEach(() => {
        resolver.setArgs({
          scalar: 'String',
          filter: {
            type: `input FilterInput {
              name: String,
              age: Int,
            }`,
            description: 'Data filtering arg',
          },
        });
      });

      it('should throw error if arg does not exists', () => {
        expect(() => {
          resolver.cloneArg('missingArg', 'NewTypeNameInput');
        }).toThrowError('Argument does not exist');
      });

      it('should throw error if arg is scalar type', () => {
        expect(() => {
          resolver.cloneArg('scalar', 'NewTypeNameInput');
        }).toThrowError('should be GraphQLInputObjectType');
      });

      it('should throw error if provided incorrect new type name', () => {
        expect(() => {
          resolver.cloneArg('filter', '');
        }).toThrowError('should provide new type name');
        expect(() => {
          resolver.cloneArg('filter', '#3fdsf');
        }).toThrowError('should provide new type name');
        expect(() => {
          resolver.cloneArg('filter', 'FilterInput');
        }).toThrowError('It is equal to current name');
      });

      it('should clone arg type', () => {
        resolver.cloneArg('filter', 'NewFilterInput');
        expect(resolver.getArgType('filter').name).toBe('NewFilterInput');
        expect(resolver.getArg('filter').description).toBe('Data filtering arg');
      });
    });
  });

  describe('getFieldConfig()', () => {
    it('should return fieldConfig', () => {
      const fc = resolver.getFieldConfig();
      expect(fc).toHaveProperty('type');
      expect(fc).toHaveProperty('args');
      expect(fc).toHaveProperty('description');
      expect(fc).toHaveProperty('resolve');
    });

    it('should combine all resolve args to resolveParams', () => {
      let rp;
      resolver.resolve = resolveParams => {
        rp = resolveParams;
      };
      const fc = resolver.getFieldConfig();
      fc.resolve('sourceData', 'argsData', 'contextData', 'infoData');
      expect(rp).toHaveProperty('source', 'sourceData');
      expect(rp).toHaveProperty('args', 'argsData');
      expect(rp).toHaveProperty('context', 'contextData');
      expect(rp).toHaveProperty('info', 'infoData');
    });

    it('should create `projection` property', () => {
      let rp;
      resolver.resolve = resolveParams => {
        rp = resolveParams;
      };
      const fc = resolver.getFieldConfig();
      fc.resolve();
      expect(rp).toHaveProperty('projection');
    });

    it('should resolve args configs as thunk', () => {
      let rp;
      resolver.setArgs({
        arg1: 'String',
        arg2: () => 'String',
        arg3: {
          type: () => 'String',
        },
      });
      const fc = resolver.getFieldConfig();
      expect(fc.args.arg1.type).toBe(GraphQLString);
      expect(fc.args.arg2.type).toBe(GraphQLString);
      expect(fc.args.arg3.type).toBe(GraphQLString);
    });
  });

  describe('wrapCloneArg()', () => {
    let newResolver;

    beforeEach(() => {
      resolver.setArgs({
        other: '[String]',
        filter: {
          type: `input FilterInput {
            name: String,
            age: Int,
          }`,
          description: 'Data filtering arg',
        },
      });

      newResolver = resolver.wrapCloneArg('filter', 'NewFilterInput');
    });

    it('should return new resolver', () => {
      expect(newResolver).not.toBe(resolver);
    });

    it('should clone type for argument', () => {
      expect(newResolver.getArg('filter')).not.toBe(resolver.getArg('filter'));
      expect(newResolver.getArgType('filter')).not.toBe(resolver.getArgType('filter'));
    });

    it('should keep untouched other args', () => {
      expect(newResolver.getArg('other')).not.toBe(resolver.getArg('other'));
      expect(newResolver.getArgType('other')).toBe(resolver.getArgType('other'));
    });
  });

  it('should return data from resolve', async () => {
    const myResolver = new Resolver({
      name: 'customResolver',
      resolve: () => ({ name: 'Nodkz' }),
      type: `
        type SomeType {
          name: String
        }
      `,
    });

    GQC.rootQuery().addRelation('resolveUser', () => ({
      resolver: myResolver,
      projection: { _id: true },
    }));

    const schema = GQC.buildSchema();
    const result = await graphql(schema, '{ resolveUser { name } }');
    expect(result).toEqual({
      data: {
        resolveUser: {
          name: 'Nodkz',
        },
      },
    });
  });

  describe('addFilterArg', () => {
    it('should add arg to filter and setup default value', () => {
      const newResolver = resolver.addFilterArg({
        name: 'age',
        type: 'Int!',
        defaultValue: 20,
        description: 'Age filter',
        filterTypeNameFallback: 'FilterUniqueNameInput',
      });

      expect(resolver.getArg('filter')).toBeFalsy();

      const filterCfg = newResolver.getArg('filter');
      expect(filterCfg).toBeTruthy();
      expect(filterCfg.type).toBeInstanceOf(GraphQLInputObjectType);
      expect(filterCfg.defaultValue).toEqual({ age: 20 });

      const filterITC = new InputTypeComposer(filterCfg.type);
      expect(filterITC.getField('age').description).toBe('Age filter');
      expect(filterITC.getFieldType('age')).toBeInstanceOf(GraphQLNonNull);
      expect(filterITC.getFieldType('age').ofType).toBe(GraphQLInt);
    });

    it('should prepare resolveParams.rawQuery when `resolve` called', () => {
      let rpSnap;
      const resolve = resolver.resolve;
      resolver.resolve = rp => {
        rpSnap = rp;
        return resolve(rp);
      };

      const newResolver = resolver
        .addFilterArg({
          name: 'age',
          type: 'Int!',
          description: 'Age filter',
          query: (query, value, resolveParams) => {
            query.age = { $gt: value }; // eslint-disable-line no-param-reassign
            query.someKey = resolveParams.someKey; // eslint-disable-line no-param-reassign
          },
          filterTypeNameFallback: 'FilterUniqueNameInput',
        })
        .addFilterArg({
          name: 'isActive',
          type: 'Boolean!',
          description: 'Active status filter',
          query: (query, value, resolveParams) => {
            query.isActive = value; // eslint-disable-line no-param-reassign
          },
          filterTypeNameFallback: 'FilterOtherUniqueNameInput',
        });

      newResolver.resolve({
        args: { filter: { age: 15, isActive: false } },
        someKey: 16,
      });

      // $FlowFixMe
      expect(rpSnap.rawQuery).toEqual({
        age: { $gt: 15 },
        isActive: false,
        someKey: 16,
      });
    });

    it('should extend default value', () => {
      resolver.setArg('filter', {
        type: new GraphQLInputObjectType({
          name: 'MyFilterInput',
          fields: {
            name: {
              type: GraphQLString,
            },
          },
        }),
        defaultValue: {
          name: 'User',
        },
      });

      const newResolver = resolver.addFilterArg({
        name: 'age',
        type: 'Int',
        defaultValue: 33,
        filterTypeNameFallback: 'FilterUniqueNameInput',
      });

      expect(newResolver.getArg('filter').defaultValue).toEqual({
        name: 'User',
        age: 33,
      });
    });

    it('should throw errors if provided incorrect options', () => {
      expect(() => {
        resolver.addFilterArg({});
      }).toThrowError('`opts.name` is required');

      expect(() => {
        resolver.addFilterArg({
          name: 'price',
        });
      }).toThrowError('`opts.type` is required');

      expect(() => {
        resolver.addFilterArg({
          name: 'price',
          type: 'input {min: Int}',
        });
      }).toThrowError('opts.filterTypeNameFallback: string');
    });
  });

  it('should return nested name for Resolver', () => {
    const r1 = new Resolver({ name: 'find' });
    const r2 = r1.wrapResolve(next => resolveParams => {
      // eslint-disable-line
      return 'function code';
    });

    expect(r1.getNestedName()).toBe('find');
    expect(r2.getNestedName()).toBe('wrapResolve(find)');
  });

  it('should on toString() call provide debug info with source code', () => {
    const r1 = new Resolver({ name: 'find' });
    const r2 = r1.wrapResolve(next => resolveParams => {
      // eslint-disable-line
      return 'function code';
    });

    expect(r2.toString()).toContain('function code');
  });

  it('should return type by path', () => {
    const rsv = new Resolver({
      name: 'find',
      type: 'type LonLat { lon: Float, lat: Float }',
      args: {
        distance: 'Int!',
      },
    });

    expect(rsv.get('lat')).toBe(GraphQLFloat);
    expect(rsv.get('@distance')).toBe(GraphQLInt);
  });

  describe('addSortArg', () => {
    it('should extend SortEnum by new value', () => {
      resolver.setArg('sort', {
        type: new GraphQLEnumType({
          name: 'MySortEnum',
          values: {
            AGE_ASC: {},
          },
        }),
      });

      const newResolver = resolver.addSortArg({
        name: 'PRICE_ASC',
        description: 'Asc sort by non-null price',
        value: { price: 1 },
      });

      const sortEnum = newResolver.getArg('sort').type;
      expect(sortEnum.parseValue('AGE_ASC')).toBe('AGE_ASC');
      expect(sortEnum.parseValue('PRICE_ASC')).toEqual({ price: 1 });
    });

    it('should prepare sort value when `resolve` called', () => {
      let rpSnap;
      const resolve = resolver.resolve;
      resolver.resolve = rp => {
        rpSnap = rp;
        return resolve(rp);
      };
      let whereSnap;
      const query = {
        where: condition => {
          whereSnap = condition;
        },
      };

      const newResolver = resolver.addSortArg({
        name: 'PRICE_ASC',
        description: 'Asc sort by non-null price',
        value: resolveParams => {
          resolveParams.query.where({ price: { $gt: 0 } }); // eslint-disable-line no-param-reassign
          return { price: 1 };
        },
        sortTypeNameFallback: 'SortEnum',
      });

      newResolver.resolve({ args: { sort: 'PRICE_ASC' }, query });
      // $FlowFixMe
      expect(rpSnap.args.sort).toEqual({ price: 1 });
      expect(whereSnap).toEqual({ price: { $gt: 0 } });
    });

    it('should throw errors if provided incorrect options', () => {
      expect(() => {
        resolver.addSortArg({});
      }).toThrowError('`opts.name` is required');

      expect(() => {
        resolver.addSortArg({
          name: 'PRICE_ASC',
        });
      }).toThrowError('`opts.value` is required');

      expect(() => {
        resolver.addSortArg({
          name: 'PRICE_ASC',
          value: 123,
        });
      }).toThrowError('opts.sortTypeNameFallback: string');

      expect(() => {
        resolver.setArg('sort', { type: GraphQLInt });
        resolver.addSortArg({
          name: 'PRICE_ASC',
          value: 123,
        });
      }).toThrowError('should have `sort` arg with type GraphQLEnumType');
    });
  });

  it('should have chainable methods', () => {
    expect(resolver.setArgs({})).toBe(resolver);
    expect(resolver.setArg('a1', 'String')).toBe(resolver);
    expect(resolver.addArgs({ a2: 'input LL { f1: Int, f2: Int }' })).toBe(resolver);
    expect(resolver.removeArg('a1')).toBe(resolver);
    expect(resolver.removeOtherArgs('a2')).toBe(resolver);
    expect(resolver.reorderArgs(['a1'])).toBe(resolver);
    expect(resolver.cloneArg('a2', 'NewTypeName')).toBe(resolver);
    expect(resolver.makeRequired('a2')).toBe(resolver);
    expect(resolver.makeOptional('a2')).toBe(resolver);
    expect(resolver.setResolve(() => {})).toBe(resolver);
    expect(resolver.setType('String')).toBe(resolver);
    expect(resolver.setKind('query')).toBe(resolver);
    expect(resolver.setDescription('Find method')).toBe(resolver);
  });
});
