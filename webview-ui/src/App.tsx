import { get, includes } from 'lodash';
import { Button } from '@alicloud/console-components';
import { RcTable, Copy, StatusIndicator } from '@xsahxl/ui';
import axios from 'axios';
import { vscode } from './utils';
import { useState } from 'react';


function App() {
  const PACKAGE_MANAGE_CONFIG = get(window, 'PACKAGE_MANAGE_CONFIG');
  const { packageJson, packagePath } = get(PACKAGE_MANAGE_CONFIG, 'data', {} as any);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const data = [];
    const dependencies = get(packageJson, 'dependencies', {} as any);
    for (const key in dependencies) {
      data.push({
        name: key,
        version: dependencies[key],
        type: 'dependencies',
      })
    }
    const devDependencies = get(packageJson, 'devDependencies', {} as any);
    for (const key in devDependencies) {
      data.push({
        name: key,
        version: devDependencies[key],
        type: 'devDependencies',
      })
    }
    const plist = [];
    for (const item of data) {
      const fn = async () => {
        let response: any = await axios.get(`https://registry.npmjs.org/${item.name}`);
        response = get(response, 'data', {});

        return {
          ...item, description: response.description, latest: get(response, ['dist-tags', 'latest'])
        };
      }
      plist.push(fn())
    }
    const result = await Promise.all(plist);
    console.log(result, 'result')
    return {
      data: result
    }
  }

  const handleUpdate = (record: Record<string, any>) => {
    setLoading(true)
    vscode.postMessage({
      eventId: 'update',
      data: {
        name: record.name,
        version: record.latest,
        packagePath,
      }
    })
  }

  const statusRender = (record: Record<string, any>) => {
    const isLatest = includes(record.version, record.latest) || includes(['*', 'latest'], record.version)
    if (isLatest) {
      return (
        <>
          <StatusIndicator type='success' shape="dot">
            latest:
            <span style={{ marginLeft: 4 }}>{record.latest}</span>
          </StatusIndicator>
        </>
      )
    }
    return (
      <>
        <StatusIndicator type='warning' shape="dot">
          latest:
          <span style={{ marginLeft: 4 }}>{record.latest}</span>
          <Button type='primary' disabled={loading} text style={{ marginLeft: 8 }} onClick={() => handleUpdate(record)}>
            update
          </Button>
        </StatusIndicator>
      </>
    )
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      width: 150,
      cell: (value: string) => <Copy text={value}>{value}</Copy>
    },
    {
      key: 'version',
      title: 'Version',
      dataIndex: 'version',
      width: 150,
      cell: (value: string, index: string, record: Record<string, any>) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: 8 }}>{value}</div>
            {statusRender(record)}
          </div>
        )
      },
    },
    {
      key: 'description',
      title: 'Description',
      width: 300,
      dataIndex: 'description',
    },
    {
      key: 'type',
      title: 'Type',
      width: 80,
      dataIndex: 'type',
    },
  ];

  return (
    <RcTable
      fetchData={fetchData}
      columns={columns}
      pagination={false}
    />
  );
}

export default App;
