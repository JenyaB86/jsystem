package com.aqua.anttask.jsystem;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Scanner;
import java.util.logging.Level;
import java.util.logging.Logger;

import jsystem.utils.StringUtils;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.taskdefs.MacroInstance;

public class JSystemDataDrivenTask extends ForTask {

	private static final String DELIMITER = ";";

	static Logger log = Logger.getLogger(JSystemDataDrivenTask.class.getName());

	String uuid;
	String scenarioString;

	private String file;

	private String type;

	private List<Map<String, Object>> data;

	private int itrerationNum = 0;

	public void setParentName(String name) {
		if (name.startsWith(".")) {
			name = name.substring(1);
		}
		scenarioString = name;
	}

	public void execute() throws BuildException {

		if (!JSystemAntUtil.doesContainerHaveEnabledTests(uuid)) {
			return;
		}

		Properties properties = JSystemAntUtil.getPropertiesValue(scenarioString, uuid);
		type = JSystemAntUtil.getParameterValue("Type", "", properties);
		if (StringUtils.isEmpty(type)) {
			type = "Csv";
		}
		DataCollector collector = null;
		if (type.equals("Excel")) {
			collector = new ExcelDataCollector();
		} else if (type.equals("Csv")) {
			collector = new CsvDataCollector();
		} else if (type.equals("Database")) {
			collector = new DatabaseDataCollector();
		} else {
			log.log(Level.WARNING, "Unknown data driven type");
			return;
		}
		try {
			data = collector.collect(properties);
		} catch (DataCollectorException e) {
			log.log(Level.WARNING, "Failed to collect data due to " + e.getMessage());
			return;
		}
		if (data == null || data.size() <= 1) {
			log.log(Level.INFO, "Invalid data");
			return;
		}
		convertDataToLoop();
		super.execute();
	}

	private void convertDataToLoop() {
		final String paramName = data.get(0).keySet().toArray(new String[] {})[0];
		StringBuilder sb = new StringBuilder();
		for (Map<String, Object> dataRow : data) {
			sb.append(DELIMITER).append(dataRow.get(paramName));
		}

		// Actually, we not using this parameter, but we need in order for the
		// for task to work.
		setParam(paramName);
		// And, we are also not really using the list values, only pass it to
		// the for task in order to create the number of iterations required.
		setList(sb.toString().replaceFirst(DELIMITER, ""));
	}

	@Override
	protected void doSequentialIteration(String val) {
		MacroInstance instance = new MacroInstance();
		instance.setProject(getProject());
		instance.setOwningTarget(getOwningTarget());
		instance.setMacroDef(getMacroDef());
		Map<String, Object> dataRow = data.get(itrerationNum++);
		for (String key : dataRow.keySet()) {
			if (dataRow.get(key) == null) {
				continue;
			}
			getProject().setProperty(key, dataRow.get(key).toString());
		}
		// This parameter is not really used but we need to pass it to the for
		// loop.
		instance.setDynamicAttribute(getParam().toLowerCase(), val);
		instance.execute();
	}

	public String getFile() {
		return file;
	}

	public void setFile(String file) {
		this.file = file;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public void setFullUuid(String uuid) {
		this.uuid = uuid;
	}

	class CsvDataCollector implements DataCollector {

		@Override
		public List<Map<String, Object>> collect(Properties properties) throws DataCollectorException {
			file = JSystemAntUtil.getParameterValue("File", "", properties);
			final File csvFile = new File(file);
			List<Map<String, Object>> data = new ArrayList<Map<String, Object>>();
			Scanner scanner = null;
			try {
				scanner = new Scanner(csvFile);
				String[] titles = null;
				while (scanner.hasNext()) {
					String[] line = scanner.next().split(",");
					if (null == titles) {
						titles = line;
						continue;
					}
					Map<String, Object> dataRow = new HashMap<String, Object>();
					for (int i = 0; i < line.length; i++) {
						dataRow.put(titles[i], line[i]);
					}
					data.add(dataRow);
				}
			} catch (FileNotFoundException e) {
				throw new DataCollectorException("Csv file " + file + " is not exist", e);
			} finally {
				if (scanner != null) {
					scanner.close();
				}
			}

			return data;
		}

	}

	class ExcelDataCollector implements DataCollector {

		@Override
		public List<Map<String, Object>> collect(Properties properties) throws DataCollectorException {
			throw new DataCollectorException("Excel collector is not yet implemented");
		}

	}

	class DatabaseDataCollector implements DataCollector {

		@Override
		public List<Map<String, Object>> collect(Properties properties) throws DataCollectorException {
			throw new DataCollectorException("Database collector is not yet implemented");
		}

	}

	interface DataCollector {
		List<Map<String, Object>> collect(Properties properties) throws DataCollectorException;
	}

	class DataCollectorException extends Exception {

		private static final long serialVersionUID = 1L;

		public DataCollectorException(String message) {
			super(message);
		}

		public DataCollectorException(String message, Throwable t) {
			super(message, t);
		}

	}

}
